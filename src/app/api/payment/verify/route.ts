import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCashfreeOrderStatus, processPaymentCapture } from "@/lib/cashfree";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cfOrderId } = await req.json();
    if (!cfOrderId) {
      return NextResponse.json({ error: "Missing cf_order_id" }, { status: 400 });
    }

    // Look up payment by cashfree_order_id
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("cashfree_order_id", cfOrderId)
      .single();

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Already captured — idempotent
    if (payment.status === "captured") {
      return NextResponse.json({ success: true, alreadyCaptured: true });
    }

    // Verify with Cashfree API
    const cfStatus = await getCashfreeOrderStatus(cfOrderId);

    if (cfStatus.order_status !== "PAID") {
      return NextResponse.json({
        success: false,
        status: cfStatus.order_status,
      });
    }

    // Process the captured payment
    const cfPaymentId = cfStatus.cf_payment_id || null;
    const paymentMethod = cfStatus.payment_method || null;

    await processPaymentCapture(
      payment.id,
      payment.order_id,
      payment.user_id,
      payment.payment_type,
      cfPaymentId,
      paymentMethod
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
