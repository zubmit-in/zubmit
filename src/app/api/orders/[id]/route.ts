import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendDeliveryEmail } from "@/lib/resend";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check ownership
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin" && order.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch related payments
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("id, amount, payment_type, status, created_at")
      .eq("order_id", id);

    // Map to camelCase for frontend
    const mappedOrder = {
      id: order.id,
      subject: order.subject,
      serviceType: order.service_type,
      title: order.title,
      description: order.description,
      frontPageInfo: order.front_page_info,
      rollNo: order.roll_no,
      degree: order.degree,
      specialization: order.specialization,
      semester: order.semester,
      deadline: order.deadline,
      totalPrice: order.total_price,
      advancePaid: order.advance_paid ? order.advance_amount : 0,
      advanceAmount: order.advance_amount,
      isAdvancePaid: !!order.advance_paid,
      finalPaid: order.final_paid ? order.final_amount : 0,
      finalAmount: order.final_amount,
      isFinalPaid: !!order.final_paid,
      status: order.status,
      deliveryType: order.delivery_type,
      watermarkFile: order.watermark_file_url,
      finalFile: order.final_file_url,
      referenceFile: order.reference_file_url,
      createdAt: order.created_at,
      payments: payments || [],
    };

    return NextResponse.json({ order: mappedOrder });
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.watermarkFile) updateData.watermark_file_url = body.watermarkFile;
    if (body.finalFile) updateData.final_file_url = body.finalFile;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Send delivery email when status changed to DELIVERED
    if (body.status === "DELIVERED" && order) {
      try {
        const { data: customerProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .single();

        if (customerProfile) {
          await sendDeliveryEmail(customerProfile.email, customerProfile.full_name, {
            id: order.id,
            subject: order.subject,
            totalPrice: order.total_price,
            advancePaid: order.advance_amount,
          });
        }
      } catch (emailErr) {
        console.error("Delivery email failed:", emailErr);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
