import { NextResponse } from "next/server";
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

    // Get all tasks with worker info
    const { data: tasks } = await supabaseAdmin
      .from("available_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    // Get worker profiles (role = worker)
    const workerFields = "id, full_name, email, worker_full_name, worker_contact, worker_university, worker_degree, worker_specialization, worker_roll_no, accommodation_type, tower_no, tower_room_no, block_no, block_room_no, upi_qr_url, worker_profile_complete, worker_banned, worker_ban_reason, role";
    const { data: roleWorkers } = await supabaseAdmin
      .from("profiles")
      .select(workerFields)
      .eq("role", "worker");

    // Also fetch profiles of anyone assigned to a task (may not have role=worker)
    const assignedWorkerIds = Array.from(
      new Set(
        (tasks || [])
          .map((t) => t.assigned_worker_id)
          .filter((id): id is string => typeof id === "string")
      )
    );
    const roleWorkerIds = new Set((roleWorkers || []).map((w) => w.id));
    const missingIds = assignedWorkerIds.filter((id) => !roleWorkerIds.has(id));

    let extraWorkers: typeof roleWorkers = [];
    if (missingIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select(workerFields)
        .in("id", missingIds);
      extraWorkers = data || [];
    }

    const workers = [...(roleWorkers || []), ...extraWorkers];

    // Get earnings
    const { data: earnings } = await supabaseAdmin
      .from("worker_earnings")
      .select("*")
      .order("created_at", { ascending: false });

    // Get task submissions (files uploaded by workers)
    const { data: submissions } = await supabaseAdmin
      .from("task_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    // Get orders with student info (to link tasks → orders → students)
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, title, subject, degree, specialization, semester, service_type, delivery_type, roll_no, deadline, total_price, advance_amount, final_amount, advance_paid, final_paid, status, description, front_page_info, material_note, reference_file_url, created_at")
      .order("created_at", { ascending: false });

    // Get student profiles (customers who placed orders)
    const studentIds = Array.from(new Set((orders || []).map((o) => o.user_id)));
    const { data: students } = studentIds.length > 0
      ? await supabaseAdmin
          .from("profiles")
          .select("id, full_name, email, phone, college_name, degree, specialization, semester, roll_no")
          .in("id", studentIds)
      : { data: [] };

    // Stats
    const totalTasks = tasks?.length || 0;
    const availableTasks =
      tasks?.filter((t) => t.status === "available").length || 0;
    const assignedTasks =
      tasks?.filter((t) => t.status === "assigned").length || 0;
    const submittedTasks =
      tasks?.filter((t) => t.status === "submitted" || t.status === "under_review").length || 0;
    const paidTasks = tasks?.filter((t) => t.status === "paid").length || 0;
    const totalWorkers = workers?.length || 0;
    const totalPaid =
      earnings
        ?.filter((e) => e.status === "paid")
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const pendingPayments =
      earnings
        ?.filter((e) => e.status === "processing")
        .reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    return NextResponse.json({
      stats: {
        totalTasks,
        availableTasks,
        assignedTasks,
        submittedTasks,
        paidTasks,
        totalWorkers,
        totalPaid,
        pendingPayments,
      },
      tasks: tasks || [],
      workers: workers || [],
      earnings: earnings || [],
      submissions: submissions || [],
      orders: orders || [],
      students: students || [],
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
