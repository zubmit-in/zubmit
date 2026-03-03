import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay";
import { sendOrderConfirmationEmail, sendFinalPaymentEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Client-side verification (from Razorpay checkout handler)
    if (body.razorpay_order_id && body.razorpay_payment_id && body.razorpay_signature) {
      const isValid = verifyPaymentSignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature
      );

      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }

      // Find the payment
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", body.razorpay_order_id)
        .single();

      if (paymentError || !payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Update payment status
      await supabaseAdmin
        .from("payments")
        .update({
          razorpay_payment_id: body.razorpay_payment_id,
          razorpay_signature: body.razorpay_signature,
          status: "captured",
          payment_method: body.method || null,
          captured_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      // Fetch order and user profile
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", payment.order_id)
        .single();

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("id", payment.user_id)
        .single();

      if (payment.payment_type === "advance" && order) {
        await supabaseAdmin
          .from("orders")
          .update({
            advance_paid: true,
            advance_paid_at: new Date().toISOString(),
            status: "PENDING",
          })
          .eq("id", payment.order_id);

        // Send confirmation email
        if (profile) {
          try {
            await sendOrderConfirmationEmail(
              profile.email,
              profile.full_name,
              {
                id: order.id,
                subject: order.subject,
                serviceType: order.service_type,
                deadline: formatDate(order.deadline),
                totalPrice: order.total_price,
                advancePaid: payment.amount,
              }
            );
          } catch (emailErr) {
            console.error("Email send failed:", emailErr);
          }
        }
      } else if (payment.payment_type === "final" && order) {
        await supabaseAdmin
          .from("orders")
          .update({
            final_paid: true,
            final_paid_at: new Date().toISOString(),
            status: "COMPLETED",
          })
          .eq("id", payment.order_id);

        // Send final payment email
        if (profile) {
          try {
            await sendFinalPaymentEmail(
              profile.email,
              profile.full_name,
              {
                id: order.id,
                title: order.title,
              }
            );
          } catch (emailErr) {
            console.error("Email send failed:", emailErr);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    // Webhook verification (from Razorpay server)
    const signature = req.headers.get("x-razorpay-signature");
    if (signature) {
      const rawBody = JSON.stringify(body);
      const isValid = verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }

      const event = body.event;
      const payload = body.payload?.payment?.entity;

      if (event === "payment.captured" && payload) {
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("razorpay_order_id", payload.order_id)
          .single();

        if (payment && payment.status !== "captured") {
          await supabaseAdmin
            .from("payments")
            .update({
              razorpay_payment_id: payload.id,
              status: "captured",
              captured_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          if (payment.payment_type === "advance") {
            await supabaseAdmin
              .from("orders")
              .update({
                advance_paid: true,
                advance_paid_at: new Date().toISOString(),
                status: "PENDING",
              })
              .eq("id", payment.order_id);
          } else if (payment.payment_type === "final") {
            await supabaseAdmin
              .from("orders")
              .update({
                final_paid: true,
                final_paid_at: new Date().toISOString(),
                status: "COMPLETED",
              })
              .eq("id", payment.order_id);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
