import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  order: {
    id: string;
    subject: string;
    serviceType: string;
    deadline: string;
    totalPrice: number;
    advancePaid: number;
  }
) {
  const remaining = order.totalPrice - order.advancePaid;
  await resend.emails.send({
    from: "Zubmit <noreply@zubmit.in>",
    to: email,
    subject: `Order Confirmed: ${order.subject} ${order.serviceType.replace(/_/g, " ")}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#2563eb;font-size:28px;font-weight:800;margin:0;">⚡ Zubmit</h1>
          </div>
          <div style="background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
            <h2 style="color:#fff;font-size:20px;margin:0 0 24px;">Order Confirmed! ✅</h2>
            <p style="color:#999;font-size:14px;margin:0 0 16px;">Hey ${name}, your order has been placed successfully.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr><td style="color:#999;padding:8px 0;border-bottom:1px solid #333;font-size:13px;">Order ID</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #333;font-size:13px;text-align:right;">${order.id}</td></tr>
              <tr><td style="color:#999;padding:8px 0;border-bottom:1px solid #333;font-size:13px;">Subject</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #333;font-size:13px;text-align:right;">${order.subject}</td></tr>
              <tr><td style="color:#999;padding:8px 0;border-bottom:1px solid #333;font-size:13px;">Service</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #333;font-size:13px;text-align:right;">${order.serviceType.replace(/_/g, " ")}</td></tr>
              <tr><td style="color:#999;padding:8px 0;border-bottom:1px solid #333;font-size:13px;">Deadline</td><td style="color:#f97316;padding:8px 0;border-bottom:1px solid #333;font-size:13px;text-align:right;">${order.deadline}</td></tr>
              <tr><td style="color:#999;padding:8px 0;border-bottom:1px solid #333;font-size:13px;">Advance Paid</td><td style="color:#22c55e;padding:8px 0;border-bottom:1px solid #333;font-size:13px;text-align:right;">₹${order.advancePaid}</td></tr>
              <tr><td style="color:#999;padding:8px 0;font-size:13px;">Remaining</td><td style="color:#fff;padding:8px 0;font-size:13px;text-align:right;font-weight:700;">₹${remaining}</td></tr>
            </table>
            <p style="color:#999;font-size:13px;margin:0;">The remaining ₹${remaining} is due upon delivery.</p>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://wa.me/${process.env.WHATSAPP_NUMBER}" style="color:#22c55e;font-size:13px;">Need help? Chat on WhatsApp</a>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendDeliveryEmail(
  email: string,
  name: string,
  order: { id: string; subject: string; totalPrice: number; advancePaid: number }
) {
  const remaining = order.totalPrice - order.advancePaid;
  await resend.emails.send({
    from: "Zubmit <noreply@zubmit.in>",
    to: email,
    subject: `Your Assignment is Ready! Pay to Download`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#2563eb;font-size:28px;font-weight:800;margin:0;">⚡ Zubmit</h1>
          </div>
          <div style="background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
            <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">Your Assignment is Ready! 🎉</h2>
            <p style="color:#999;font-size:14px;margin:0 0 24px;">Hey ${name}, your ${order.subject} assignment has been completed.</p>
            <div style="background:#0a0a0a;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;border:1px solid #333;">
              <p style="color:#999;font-size:13px;margin:0 0 4px;">Pay remaining amount to download</p>
              <p style="color:#2563eb;font-size:32px;font-weight:800;margin:0;">₹${remaining}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}" style="display:block;background:#2563eb;color:#fff;text-decoration:none;padding:14px;text-align:center;border-radius:8px;font-weight:600;font-size:15px;">View Order & Pay</a>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendFinalPaymentEmail(
  email: string,
  name: string,
  order: { id: string; title: string }
) {
  await resend.emails.send({
    from: "Zubmit <noreply@zubmit.in>",
    to: email,
    subject: `Download Your Assignment: ${order.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#2563eb;font-size:28px;font-weight:800;margin:0;">⚡ Zubmit</h1>
          </div>
          <div style="background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
            <h2 style="color:#fff;font-size:20px;margin:0 0 16px;">Payment Received! ✅</h2>
            <p style="color:#999;font-size:14px;margin:0 0 24px;">Hey ${name}, your payment has been confirmed. You can now download your original assignment.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}" style="display:block;background:#22c55e;color:#fff;text-decoration:none;padding:14px;text-align:center;border-radius:8px;font-weight:600;font-size:15px;">Download Assignment</a>
            <p style="color:#999;font-size:13px;text-align:center;margin:24px 0 0;">Thank you for using Zubmit! 🙏</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
