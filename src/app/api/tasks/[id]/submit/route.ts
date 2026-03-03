import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDigitalSubmissionEmail } from "@/lib/emails/workerEmails";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Verify task is assigned to this worker
    const { data: task, error: taskError } = await supabaseAdmin
      .from("available_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.assigned_worker_id !== userId) {
      return NextResponse.json(
        { error: "Task not assigned to you" },
        { status: 403 }
      );
    }

    if (task.delivery_type !== "digital") {
      return NextResponse.json(
        { error: "This route is for digital submissions only" },
        { status: 400 }
      );
    }

    // Check if deadline (real - 8h) has passed
    const modifiedDeadline =
      new Date(task.real_deadline).getTime() - 8 * 3600000;
    if (Date.now() > modifiedDeadline) {
      return NextResponse.json(
        { error: "Submission deadline has passed" },
        { status: 400 }
      );
    }

    // Parse FormData, get file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Upload file to task-submissions bucket
    const fileName = `${taskId}/${userId}-${Date.now()}-${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("task-submissions")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: fileUrl },
    } = supabaseAdmin.storage.from("task-submissions").getPublicUrl(fileName);

    // Check if submission already exists (revision case)
    const { data: existingSubmission } = await supabaseAdmin
      .from("task_submissions")
      .select("id, revision_count")
      .eq("task_id", taskId)
      .eq("worker_id", userId)
      .single();

    const now = new Date().toISOString();

    if (existingSubmission) {
      // Update existing submission (revision)
      await supabaseAdmin
        .from("task_submissions")
        .update({
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          revision_count: (existingSubmission.revision_count || 0) + 1,
          review_status: "pending",
          submitted_at: now,
        })
        .eq("id", existingSubmission.id);

      // Insert revision stage
      await supabaseAdmin.from("task_review_stages").insert({
        task_id: taskId,
        worker_id: userId,
        stage: "revision_submitted",
        message: `Revised assignment submitted (Revision ${(existingSubmission.revision_count || 0) + 1} of 3).`,
      });
    } else {
      // Insert new submission
      await supabaseAdmin.from("task_submissions").insert({
        task_id: taskId,
        worker_id: userId,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        review_status: "pending",
        submitted_at: now,
      });
    }

    // Update task status
    await supabaseAdmin
      .from("available_tasks")
      .update({ status: "under_review" })
      .eq("id", taskId);

    // Insert review stages
    await supabaseAdmin.from("task_review_stages").insert({
      task_id: taskId,
      worker_id: userId,
      stage: "digital_submitted",
      message: "Assignment submitted successfully!",
    });

    await supabaseAdmin.from("task_review_stages").insert({
      task_id: taskId,
      worker_id: userId,
      stage: "under_review",
      message: "Your submission is under review. We'll update you soon.",
    });

    // Get worker profile for email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("worker_full_name, worker_contact, worker_university, worker_roll_no")
      .eq("id", userId)
      .single();

    // Send email
    if (profile) {
      try {
        await sendDigitalSubmissionEmail(
          {
            full_name: profile.worker_full_name || "",
            contact: profile.worker_contact || "",
            university: profile.worker_university || "",
            roll_no: profile.worker_roll_no || "",
          },
          {
            title: task.title,
            subject: task.subject,
            service_type: task.service_type,
          },
          fileUrl,
          now
        );
      } catch (err) {
        console.error("[SUBMIT] Email send failed:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
