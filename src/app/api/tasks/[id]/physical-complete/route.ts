import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPhysicalCompleteEmail } from "@/lib/emails/workerEmails";

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

    // Verify task is assigned to this worker and is physical
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

    if (task.delivery_type !== "physical") {
      return NextResponse.json(
        { error: "This route is for physical assignments only" },
        { status: 400 }
      );
    }

    if (task.status !== "assigned") {
      return NextResponse.json(
        { error: "Task cannot be marked complete in current status" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update or insert task_submissions
    const { data: existingSubmission } = await supabaseAdmin
      .from("task_submissions")
      .select("id")
      .eq("task_id", taskId)
      .eq("worker_id", userId)
      .single();

    if (existingSubmission) {
      await supabaseAdmin
        .from("task_submissions")
        .update({
          is_physical_complete: true,
          physical_completed_at: now,
        })
        .eq("id", existingSubmission.id);
    } else {
      await supabaseAdmin.from("task_submissions").insert({
        task_id: taskId,
        worker_id: userId,
        is_physical_complete: true,
        physical_completed_at: now,
      });
    }

    // Update task status
    await supabaseAdmin
      .from("available_tasks")
      .update({ status: "submitted" })
      .eq("id", taskId);

    // Insert review stage — physical_completed only
    await supabaseAdmin.from("task_review_stages").insert({
      task_id: taskId,
      worker_id: userId,
      stage: "physical_completed",
      message:
        "Assignment marked as complete. Our team will collect it shortly.",
    });

    // Get worker profile for email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select(
        "worker_full_name, worker_contact, worker_university, worker_roll_no, accommodation_type, tower_no, tower_room_no, block_no, block_room_no"
      )
      .eq("id", userId)
      .single();

    // Send email
    if (profile) {
      try {
        await sendPhysicalCompleteEmail(
          {
            full_name: profile.worker_full_name || "",
            contact: profile.worker_contact || "",
            university: profile.worker_university || "",
            roll_no: profile.worker_roll_no || "",
            accommodation_type: profile.accommodation_type || "",
            tower_no: profile.tower_no ?? undefined,
            tower_room_no: profile.tower_room_no ?? undefined,
            block_no: profile.block_no ?? undefined,
            block_room_no: profile.block_room_no ?? undefined,
          },
          {
            title: task.title,
            subject: task.subject,
            service_type: task.service_type,
          },
          now
        );
      } catch (err) {
        console.error("[PHYSICAL] Email send failed:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Physical complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
