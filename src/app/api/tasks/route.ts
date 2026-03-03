import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = req.nextUrl.searchParams.get("filter") || "available";

    if (filter === "available") {
      // Query worker_tasks_view WHERE status = 'available'
      // IMPORTANT: Always use worker_tasks_view (not available_tasks table directly)
      // This ensures real_deadline is never exposed
      const { data: tasks, error } = await supabaseAdmin
        .from("worker_tasks_view" as any)
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch available tasks error:", error);
        return NextResponse.json(
          { error: "Failed to fetch tasks" },
          { status: 500 }
        );
      }

      return NextResponse.json({ tasks: tasks || [] });
    }

    if (filter === "mine") {
      // Query worker_tasks_view WHERE assigned_worker_id = userId
      const { data: tasks, error } = await supabaseAdmin
        .from("worker_tasks_view" as any)
        .select("*")
        .eq("assigned_worker_id", userId)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Fetch my tasks error:", error);
        return NextResponse.json(
          { error: "Failed to fetch tasks" },
          { status: 500 }
        );
      }

      return NextResponse.json({ tasks: tasks || [] });
    }

    return NextResponse.json({ error: "Invalid filter" }, { status: 400 });
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
