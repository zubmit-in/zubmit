import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin check
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id: taskId } = await params;
    const body = await req.json();
    const { action, notes, review_files } = body as {
      action: "approve" | "revision";
      notes?: string;
      review_files?: { name: string; url: string }[];
    };

    // Get task
    const { data: task, error: taskError } = await supabaseAdmin
      .from("available_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!task.assigned_worker_id) {
      return NextResponse.json(
        { error: "No worker assigned" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update task to approved
      await supabaseAdmin
        .from("available_tasks")
        .update({ status: "payment_processing" })
        .eq("id", taskId);

      // Insert approved stage
      await supabaseAdmin.from("task_review_stages").insert({
        task_id: taskId,
        worker_id: task.assigned_worker_id,
        stage: "approved",
        message:
          "Your work has been approved! Payment is being processed.",
      });

      // Insert payment_processing stage
      await supabaseAdmin.from("task_review_stages").insert({
        task_id: taskId,
        worker_id: task.assigned_worker_id,
        stage: "payment_processing",
        message:
          "Payment is being sent to your UPI. Usually within 24 hours.",
      });

      // Insert worker_earnings
      await supabaseAdmin.from("worker_earnings").insert({
        worker_id: task.assigned_worker_id,
        task_id: taskId,
        amount: task.worker_pay,
        status: "processing",
      });

      return NextResponse.json({ success: true });
    }

    if (action === "revision") {
      // Check revision limit
      if ((task.revision_count || 0) >= 3) {
        return NextResponse.json(
          {
            error:
              "Maximum revisions reached. Final decision required.",
          },
          { status: 400 }
        );
      }

      // Increment revision count and update status
      await supabaseAdmin
        .from("available_tasks")
        .update({
          status: "revision_required",
          revision_count: (task.revision_count || 0) + 1,
        })
        .eq("id", taskId);

      // Insert revision stage
      await supabaseAdmin.from("task_review_stages").insert({
        task_id: taskId,
        worker_id: task.assigned_worker_id,
        stage: "revision_required",
        message:
          notes ? "Changes are required. See details below." : "Changes are required. We will contact you with specific instructions. Please be ready.",
        admin_note: notes || null,
        review_files: review_files && review_files.length > 0 ? review_files : null,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
