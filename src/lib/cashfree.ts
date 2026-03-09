import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendOrderConfirmationEmail, sendFinalPaymentEmail } from "@/lib/resend";
import { formatDate } from "@/lib/utils";

const API_VERSION = "2023-08-01";

export function getCashfreeBaseUrl(): string {
  return process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function getCashfreeHeaders() {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
    "x-api-version": API_VERSION,
    "Content-Type": "application/json",
  };
}

export function getCashfreeCheckoutUrl(paymentSessionId: string): string {
  const base = process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
    ? "https://payments.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
  return `${base}/orders/sessions/${paymentSessionId}`;
}

interface CreateOrderParams {
  orderId: string;
  orderAmount: number; // in rupees
  customerDetails: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  returnUrl: string;
  notifyUrl: string;
}

interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  payment_session_id: string;
  order_status: string;
  payment_link?: string;
}

export async function createCashfreeOrder(params: CreateOrderParams): Promise<CashfreeOrderResponse> {
  // Cashfree production requires HTTPS URLs — skip localhost URLs entirely
  const isLocalhost = params.returnUrl.includes("localhost");
  const orderMeta: Record<string, string> = {};
  if (!isLocalhost) {
    orderMeta.return_url = params.returnUrl;
    orderMeta.notify_url = params.notifyUrl;
  }

  const res = await fetch(`${getCashfreeBaseUrl()}/orders`, {
    method: "POST",
    headers: getCashfreeHeaders(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.orderAmount,
      order_currency: "INR",
      customer_details: params.customerDetails,
      order_meta: orderMeta,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Cashfree order creation failed:", res.status, error);
    console.error("Cashfree request body was:", JSON.stringify({
      order_id: params.orderId,
      order_amount: params.orderAmount,
      order_currency: "INR",
      customer_details: params.customerDetails,
      order_meta: { return_url: params.returnUrl, notify_url: params.notifyUrl },
    }, null, 2));
    throw new Error(`Cashfree order creation failed (${res.status}): ${error}`);
  }

  return res.json();
}

export async function getCashfreeOrderStatus(orderId: string) {
  const res = await fetch(`${getCashfreeBaseUrl()}/orders/${orderId}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Cashfree order status check failed:", error);
    throw new Error(`Cashfree status check failed: ${res.status}`);
  }

  return res.json();
}

export function verifyCashfreeWebhook(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
    .update(timestamp + rawBody)
    .digest("base64");
  return expectedSignature === signature;
}

// Shared helper: process a captured payment (used by both verify endpoint and webhook)
export async function processPaymentCapture(
  paymentId: string, // Supabase payment row ID
  orderId: string, // Supabase order ID
  userId: string,
  paymentType: string, // "advance" or "final"
  cfPaymentId: string | null,
  paymentMethod: string | null
) {
  // Update payment record
  await supabaseAdmin
    .from("payments")
    .update({
      cf_payment_id: cfPaymentId,
      status: "captured",
      payment_method: paymentMethod,
      captured_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  // Fetch order and profile
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (paymentType === "advance" && order) {
    await supabaseAdmin
      .from("orders")
      .update({
        advance_paid: true,
        advance_paid_at: new Date().toISOString(),
        status: "PENDING",
      })
      .eq("id", orderId);

    if (profile) {
      try {
        await sendOrderConfirmationEmail(profile.email, profile.full_name, {
          id: order.id,
          subject: order.subject,
          serviceType: order.service_type,
          deadline: formatDate(order.deadline),
          totalPrice: order.total_price,
          advancePaid: order.advance_amount,
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }
  } else if (paymentType === "final" && order) {
    await supabaseAdmin
      .from("orders")
      .update({
        final_paid: true,
        final_paid_at: new Date().toISOString(),
        status: "COMPLETED",
      })
      .eq("id", orderId);

    if (profile) {
      try {
        await sendFinalPaymentEmail(profile.email, profile.full_name, {
          id: order.id,
          title: order.title,
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }
  }
}
