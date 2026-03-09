import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createCashfreeOrder } from "@/lib/cashfree";
import { getFinalAmount } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, type } = await req.json();

    if (!orderId || !type) {
      return NextResponse.json({ error: "Order ID and type required" }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Allow order owner or admin to initiate payment
    if (order.user_id !== userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Use order owner as the paying user
    const payingUserId = order.user_id;

    let amount: number;
    if (type === "FINAL") {
      amount = getFinalAmount(order.total_price);
    } else {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    // Fetch order owner's profile for Cashfree customer details
    const { data: payerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, phone")
      .eq("id", payingUserId)
      .single();

    const cfOrderId = `zubmit_${orderId.slice(0, 8)}_final_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const cashfreeOrder = await createCashfreeOrder({
      orderId: cfOrderId,
      orderAmount: amount,
      customerDetails: {
        customer_id: payingUserId,
        customer_name: payerProfile?.full_name || "Customer",
        customer_email: payerProfile?.email || "",
        customer_phone: payerProfile?.phone || "9999999999",
      },
      returnUrl: `${appUrl}/order/${orderId}?cf_order_id={order_id}`,
      notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    });

    await supabaseAdmin.from("payments").insert({
      order_id: orderId,
      user_id: payingUserId,
      cashfree_order_id: cfOrderId,
      payment_session_id: cashfreeOrder.payment_session_id,
      amount,
      amount_paise: amount * 100,
      payment_type: "final",
      status: "created",
    });

    return NextResponse.json({
      success: true,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount,
    });
  } catch (error) {
    console.error("Payment create error:", error instanceof Error ? error.message : error);
    return NextResponse.json({
      error: "Failed to create payment",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
