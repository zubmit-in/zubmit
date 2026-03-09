import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
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

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: taskId } = await params;

    // Fetch the task to check status
    const { data: task, error: fetchError } = await supabaseAdmin
      .from("available_tasks")
      .select("id, status")
      .eq("id", taskId)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only allow deleting tasks that are "available" (not yet assigned)
    if (task.status !== "available") {
      return NextResponse.json(
        { error: "Can only delete tasks with 'available' status. This task is already " + task.status },
        { status: 400 }
      );
    }

    // Delete the task
    const { error: deleteError } = await supabaseAdmin
      .from("available_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      console.error("Task delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
