import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTaskAcceptedEmail } from "@/lib/emails/workerEmails";

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

    // Get worker profile — must be complete
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (
      !profile.worker_profile_complete ||
      (profile.role !== "worker" && profile.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Complete your profile first" },
        { status: 403 }
      );
    }

    // Check if worker already has an active task (must complete current before accepting new)
    const { data: activeTasks } = await supabaseAdmin
      .from("available_tasks")
      .select("id")
      .eq("assigned_worker_id", userId)
      .in("status", ["assigned", "under_review", "revision_required"])
      .limit(1);

    if (activeTasks && activeTasks.length > 0) {
      return NextResponse.json(
        { error: "You must complete your current assignment before accepting a new one" },
        { status: 400 }
      );
    }

    // Get task from available_tasks (full table, admin access)
    const { data: task, error: taskError } = await supabaseAdmin
      .from("available_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status !== "available") {
      return NextResponse.json(
        { error: "Task no longer available" },
        { status: 400 }
      );
    }

    // Conditional update to prevent race condition
    const { data: updatedRows, error: updateError } = await supabaseAdmin
      .from("available_tasks")
      .update({
        status: "assigned",
        assigned_worker_id: userId,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("status", "available")
      .select();

    if (updateError || !updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: "Task was just taken by someone else" },
        { status: 400 }
      );
    }

    // Insert task_review_stages
    await supabaseAdmin.from("task_review_stages").insert({
      task_id: taskId,
      worker_id: userId,
      stage: "task_accepted",
      message: "You accepted this task. Get started right away!",
    });

    // Send email to admin with all details
    const workerDeadline = new Date(
      new Date(task.real_deadline).getTime() - 8 * 3600000
    ).toISOString();

    try {
      await sendTaskAcceptedEmail(
        {
          full_name: profile.worker_full_name || "",
          contact: profile.worker_contact || "",
          university: profile.worker_university || "",
          roll_no: profile.worker_roll_no || "",
          degree: profile.worker_degree || "",
          specialization: profile.worker_specialization || "",
          accommodation_type: profile.accommodation_type || "",
          tower_no: profile.tower_no ?? undefined,
          tower_room_no: profile.tower_room_no ?? undefined,
          block_no: profile.block_no ?? undefined,
          block_room_no: profile.block_room_no ?? undefined,
          upi_qr_url: profile.upi_qr_url || "",
        },
        {
          title: task.title,
          subject: task.subject,
          degree: task.degree,
          specialization: task.specialization,
          semester: task.semester,
          service_type: task.service_type,
          delivery_type: task.delivery_type,
          worker_pay: task.worker_pay,
          worker_deadline: workerDeadline,
          real_deadline: task.real_deadline,
        }
      );
    } catch (err) {
      console.error("[ACCEPT] Email send failed:", err);
    }

    // Return the task as seen through the view (with modified deadline)
    const { data: viewTask } = await supabaseAdmin
      .from("worker_tasks_view" as any)
      .select("*")
      .eq("id", taskId)
      .single();

    return NextResponse.json({ success: true, task: viewTask });
  } catch (error) {
    console.error("Task accept error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
