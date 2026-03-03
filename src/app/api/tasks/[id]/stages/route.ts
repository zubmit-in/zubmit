import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    const { data: stages, error } = await supabaseAdmin
      .from("task_review_stages")
      .select("*")
      .eq("task_id", taskId)
      .eq("worker_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch stages error:", error);
      return NextResponse.json(
        { error: "Failed to fetch stages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stages: stages || [] });
  } catch (error) {
    console.error("Stages fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
