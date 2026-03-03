import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { data: workers } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("role", "worker")
      .order("created_at", { ascending: false });

    return NextResponse.json({ workers: workers || [] });
  } catch (error) {
    console.error("Admin workers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Ban/unban a worker
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { worker_id, action, reason } = body as {
      worker_id: string;
      action: "ban" | "unban";
      reason?: string;
    };

    if (!worker_id || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === "ban") {
      await supabaseAdmin
        .from("profiles")
        .update({
          worker_banned: true,
          worker_ban_reason: reason || "Banned by admin",
        })
        .eq("id", worker_id);
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({
          worker_banned: false,
          worker_ban_reason: null,
        })
        .eq("id", worker_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin worker action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
