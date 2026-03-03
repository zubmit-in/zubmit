import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, worker_banned, worker_agreed")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.worker_banned) {
      return NextResponse.json(
        { error: "You have been banned from the platform" },
        { status: 403 }
      );
    }

    if (profile.worker_agreed) {
      return NextResponse.json(
        { error: "Already agreed to terms" },
        { status: 400 }
      );
    }

    // Only set worker_agreed = true here
    // Role = 'worker' is set ONLY after profile setup in /api/worker/setup-profile
    await supabaseAdmin
      .from("profiles")
      .update({
        worker_agreed: true,
        worker_agreed_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Worker apply error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
