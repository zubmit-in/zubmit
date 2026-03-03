import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { razorpay } from "@/lib/razorpay";
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

    if (order.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let amount: number;
    if (type === "FINAL") {
      amount = getFinalAmount(order.total_price);
    } else {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `order_${orderId}_${type.toLowerCase()}`,
      notes: {
        orderId,
        type: type.toLowerCase(),
        userId,
      },
    });

    await supabaseAdmin.from("payments").insert({
      order_id: orderId,
      user_id: userId,
      razorpay_order_id: razorpayOrder.id,
      amount,
      amount_paise: amount * 100,
      payment_type: "final",
      status: "created",
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: amount * 100,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
