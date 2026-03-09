import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Total earned (paid earnings)
    const { data: paidEarnings } = await supabaseAdmin
      .from("worker_earnings")
      .select("amount")
      .eq("worker_id", userId)
      .eq("status", "paid");

    const totalEarned = (paidEarnings || []).reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Pending amount (only after admin approves — status is "processing")
    const { data: pendingEarnings } = await supabaseAdmin
      .from("worker_earnings")
      .select("amount")
      .eq("worker_id", userId)
      .eq("status", "processing");

    const pendingAmount = (pendingEarnings || []).reduce(
      (sum, e) => sum + e.amount,
      0
    );

    // Tasks completed (paid tasks)
    const { count: tasksCompleted } = await supabaseAdmin
      .from("available_tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_worker_id", userId)
      .eq("status", "paid");

    // Tasks in progress (assigned but not yet paid)
    const { count: tasksInProgress } = await supabaseAdmin
      .from("available_tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_worker_id", userId)
      .neq("status", "paid")
      .neq("status", "cancelled");

    return NextResponse.json({
      total_earned: totalEarned,
      pending_amount: pendingAmount,
      tasks_completed: tasksCompleted || 0,
      tasks_in_progress: tasksInProgress || 0,
    });
  } catch (error) {
    console.error("Earnings summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
