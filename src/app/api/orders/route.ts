import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculatePrice, calculateOrderSurcharge, getAdvanceAmount } from "@/lib/pricing";
import { getHoursUntilDeadline } from "@/lib/utils";
import { createCashfreeOrder } from "@/lib/cashfree";
import type { ServiceType } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[ORDER] Step 0: Auth passed, userId:", userId);
    console.log("[ORDER] Cashfree env check:", {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
      environment: process.env.CASHFREE_ENVIRONMENT,
    });

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

    console.log("[ORDER] Step 1: Price calculated", { baseTotal, surcharge, totalPrice, advanceAmount, finalAmount });

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
        base_price: totalPrice,
        urgency_multiplier: 1,
        total_price: totalPrice,
        advance_amount: advanceAmount,
        final_amount: finalAmount,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[ORDER] Step 2 FAILED: Supabase order insert error:", orderError);
      return NextResponse.json({ error: "Failed to create order", details: orderError?.message }, { status: 500 });
    }

    console.log("[ORDER] Step 2: Order created in Supabase", order.id);

    // Fetch user profile for Cashfree customer details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, phone")
      .eq("id", userId)
      .single();

    // Get phone from Clerk if not in profile
    let customerPhone = profile?.phone || "";
    let customerEmail = profile?.email || "";
    let customerName = profile?.full_name || "Customer";
    if (!customerPhone) {
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        customerPhone = clerkUser.phoneNumbers?.[0]?.phoneNumber || "";
        if (!customerEmail) customerEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "";
        if (customerName === "Customer") customerName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Customer";
      } catch { /* fallback to profile data */ }
    }
    // Cashfree requires a valid 10-digit phone — use placeholder only as last resort
    if (!customerPhone || customerPhone.length < 10) customerPhone = "9999999999";

    console.log("[ORDER] Step 3: Profile fetched", { email: customerEmail, name: customerName, phone: customerPhone });

    // Create Cashfree order for advance
    const cfOrderId = `zubmit_${order.id.slice(0, 8)}_adv_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log("[ORDER] Step 4: Creating Cashfree order", { cfOrderId, amount: advanceAmount });

    const cashfreeOrder = await createCashfreeOrder({
      orderId: cfOrderId,
      orderAmount: advanceAmount,
      customerDetails: {
        customer_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      returnUrl: `${appUrl}/order/${order.id}?cf_order_id={order_id}`,
      notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    });

    console.log("[ORDER] Step 5: Cashfree order created", {
      sessionId: cashfreeOrder.payment_session_id,
      paymentLink: cashfreeOrder.payment_link,
    });

    // Create payment record in Supabase
    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      user_id: userId,
      cashfree_order_id: cfOrderId,
      payment_session_id: cashfreeOrder.payment_session_id,
      amount: advanceAmount,
      amount_paise: advanceAmount * 100,
      payment_type: "advance",
      status: "created",
    });

    if (paymentError) {
      console.error("[ORDER] Step 6 FAILED: Payment insert error:", paymentError);
      return NextResponse.json({ error: "Failed to create payment record", details: paymentError.message }, { status: 500 });
    }

    console.log("[ORDER] Step 6: Payment record created");

    return NextResponse.json({
      success: true,
      id: order.id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount: advanceAmount,
      totalPrice,
      advanceAmount,
    });
  } catch (error) {
    console.error("Order creation error:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
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
      .select("id, subject, service_type, status, total_price, deadline, created_at, title, degree, semester, advance_paid", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(limit);

    // "My Orders" always shows only the logged-in user's own orders
    // Admin sees all orders via the Admin Panel dashboard endpoint
    query = query.eq("user_id", userId);
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data: orders, count, error } = await query;

    if (error) {
      console.error("Orders fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // Calculate stats from ALL user orders (not just the limited query)
    const { data: allOrders } = await supabaseAdmin
      .from("orders")
      .select("status, total_price, advance_paid")
      .eq("user_id", userId);

    const allOrdersList = allOrders || [];
    const statsData = {
      pending: allOrdersList.filter((o) => {
        const s = (o.status || "").toUpperCase();
        return ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(s);
      }).length,
      delivered: allOrdersList.filter((o) => {
        const s = (o.status || "").toUpperCase();
        return ["DELIVERED", "COMPLETED"].includes(s);
      }).length,
      totalSpent: allOrdersList
        .filter((o) => o.advance_paid === true)
        .reduce((sum, o) => sum + (o.total_price || 0), 0),
    };

    // Map snake_case to camelCase for frontend compatibility
    const mappedOrders = (orders || []).map((o) => ({
      id: o.id,
      subject: o.subject,
      serviceType: o.service_type,
      status: (o.status || "").toUpperCase(),
      totalPrice: o.total_price,
      deadline: o.deadline,
      createdAt: o.created_at,
      title: o.title,
      degree: o.degree,
      semester: o.semester,
    }));

    return NextResponse.json({ orders: mappedOrders, total: count || 0, stats: statsData });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
