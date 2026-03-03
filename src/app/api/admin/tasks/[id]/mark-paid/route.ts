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
    const { upi_transaction_id } = body as { upi_transaction_id: string };

    if (!upi_transaction_id) {
      return NextResponse.json(
        { error: "UPI transaction ID is required" },
        { status: 400 }
      );
    }

    // Get task
    const { data: task, error: taskError } = await supabaseAdmin
      .from("available_tasks")
      .select("id, assigned_worker_id, worker_pay")
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

    const now = new Date().toISOString();

    // Update worker_earnings
    await supabaseAdmin
      .from("worker_earnings")
      .update({
        status: "paid",
        upi_transaction_id,
        paid_at: now,
      })
      .eq("task_id", taskId)
      .eq("worker_id", task.assigned_worker_id);

    // Update task status
    await supabaseAdmin
      .from("available_tasks")
      .update({ status: "paid" })
      .eq("id", taskId);

    // Insert paid stage
    await supabaseAdmin.from("task_review_stages").insert({
      task_id: taskId,
      worker_id: task.assigned_worker_id,
      stage: "paid",
      message: `Payment of ₹${task.worker_pay} has been sent to your UPI account. Thank you!`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin mark-paid error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
