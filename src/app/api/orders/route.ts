import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculatePrice, calculateOrderSurcharge, getAdvanceAmount } from "@/lib/pricing";
import { getHoursUntilDeadline } from "@/lib/utils";
import { razorpay } from "@/lib/razorpay";
import type { ServiceType } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      degree,
      specialization,
      semester,
      subject,
      serviceType,
      serviceTypes,
      serviceDetails,
      title,
      rollNo,
      description,
      frontPageInfo,
      deadline,
      deliveryType,
      pickupAddress,
      materialNote,
      referenceFileUrl,
      pages,
      slides,
    } = body;

    // Support both single serviceType (backward compat) and array serviceTypes
    const resolvedServiceTypes: string[] = serviceTypes && Array.isArray(serviceTypes) && serviceTypes.length > 0
      ? serviceTypes
      : serviceType ? [serviceType] : [];
    const primaryServiceType = resolvedServiceTypes[0];

    if (!degree || !semester || !subject || resolvedServiceTypes.length === 0 || !title || !rollNo || !deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate price server-side: base prices + order-level surcharge
    const hoursUntilDeadline = getHoursUntilDeadline(deadline);
    const baseTotal = resolvedServiceTypes.reduce((sum, svc) => {
      return sum + calculatePrice(svc as ServiceType);
    }, 0);
    // Per-service page counts (slides count as pages for PPT)
    const servicePageCounts = resolvedServiceTypes.map((svc) => {
      const detail = serviceDetails?.[svc];
      if (svc === "PPT") return detail?.slides ? parseInt(detail.slides.toString()) : (slides ? parseInt(slides.toString()) : 0);
      return detail?.pages ? parseInt(detail.pages.toString()) : (pages ? parseInt(pages.toString()) : 0);
    });
    const surcharge = calculateOrderSurcharge(servicePageCounts, hoursUntilDeadline);
    const totalPrice = baseTotal + surcharge;
    const advanceAmount = getAdvanceAmount(totalPrice);
    const finalAmount = totalPrice - advanceAmount;

    // Create order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        degree,
        specialization: specialization || null,
        semester: parseInt(semester.toString()),
        subject,
        service_type: primaryServiceType,
        service_types: resolvedServiceTypes,
        delivery_type: deliveryType || "DIGITAL",
        title,
        roll_no: rollNo,
        description,
        front_page_info: frontPageInfo || null,
        pickup_address: pickupAddress || null,
        material_note: materialNote || null,
        reference_file_url: referenceFileUrl || null,
        deadline: new Date(deadline).toISOString(),
        hours_until_deadline: Math.round(hoursUntilDeadline),
        base_price: totalPrice,
        urgency_multiplier: 1,
        total_price: totalPrice,
        advance_amount: advanceAmount,
        final_amount: finalAmount,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create Razorpay order for advance
    const razorpayOrder = await razorpay.orders.create({
      amount: advanceAmount * 100, // paise
      currency: "INR",
      receipt: `order_${order.id}_advance`,
      notes: {
        orderId: order.id,
        type: "advance",
        userId,
      },
    });

    // Create payment record in Supabase
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      razorpay_order_id: razorpayOrder.id,
      amount: advanceAmount,
      amount_paise: advanceAmount * 100,
      payment_type: "advance",
      status: "created",
    });

    return NextResponse.json({
      success: true,
      id: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: advanceAmount * 100,
      totalPrice,
      advanceAmount,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const role = searchParams.get("role");

    // Get user profile to check role
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const userRole = profile?.role || "student";

    let query = supabaseAdmin
      .from("orders")
      .select("id, subject, service_type, status, total_price, deadline, created_at, title, degree, semester", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userRole === "admin") {
      if (status && status !== "ALL") {
        query = query.eq("status", status);
      }
    } else if (role === "worker" && userRole === "worker") {
      query = query.eq("status", "PENDING").is("worker_id", null);
    } else {
      query = query.eq("user_id", userId);
      if (status && status !== "ALL") {
        query = query.eq("status", status);
      }
    }

    const { data: orders, count, error } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Map snake_case to camelCase for frontend compatibility
    const mappedOrders = (orders || []).map((o) => ({
      id: o.id,
      subject: o.subject,
      serviceType: o.service_type,
      status: o.status,
      totalPrice: o.total_price,
      deadline: o.deadline,
      createdAt: o.created_at,
      title: o.title,
      degree: o.degree,
      semester: o.semester,
    }));

    return NextResponse.json({ orders: mappedOrders, total: count || 0 });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
