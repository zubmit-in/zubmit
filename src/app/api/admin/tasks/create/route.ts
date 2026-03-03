import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const {
      title,
      subject,
      degree,
      specialization,
      semester,
      service_type,
      delivery_type,
      description,
      page_count,
      real_deadline,
      worker_pay,
      order_id,
      admin_notes,
    } = body;

    if (
      !title ||
      !subject ||
      !degree ||
      !specialization ||
      !semester ||
      !service_type ||
      !delivery_type ||
      !real_deadline ||
      !worker_pay
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: newTask, error } = await supabaseAdmin
      .from("available_tasks")
      .insert({
        title,
        subject,
        degree,
        specialization,
        semester,
        service_type,
        delivery_type,
        description: description || null,
        page_count: page_count || null,
        real_deadline,
        worker_pay,
        order_id: order_id || null,
        admin_notes: admin_notes || null,
        status: "available",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Create task error:", error);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, taskId: newTask?.id });
  } catch (error) {
    console.error("Admin create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
