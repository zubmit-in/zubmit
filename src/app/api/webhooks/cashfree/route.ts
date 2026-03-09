import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyCashfreeWebhook, processPaymentCapture } from "@/lib/cashfree";

export async function POST(req: NextRequest) {
  try {
    // Must read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
    }

    const isValid = verifyCashfreeWebhook(rawBody, timestamp, signature);
    if (!isValid) {
      console.error("Cashfree webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.type;

    // Handle payment success
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "PAYMENT_SUCCESS") {
      const cfOrderId = body.data?.order?.order_id;
      const cfPaymentId = body.data?.payment?.cf_payment_id?.toString() || null;
      const paymentMethod = body.data?.payment?.payment_method || null;

      if (!cfOrderId) {
        return NextResponse.json({ error: "Missing order_id in webhook" }, { status: 400 });
      }

      // Look up payment
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("cashfree_order_id", cfOrderId)
        .single();

      if (!payment) {
        console.error("Payment not found for cashfree order:", cfOrderId);
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Idempotent: skip if already captured
      if (payment.status === "captured") {
        return NextResponse.json({ success: true });
      }

      await processPaymentCapture(
        payment.id,
        payment.order_id,
        payment.user_id,
        payment.payment_type,
        cfPaymentId,
        paymentMethod
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cashfree webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
