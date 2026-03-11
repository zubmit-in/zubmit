import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "zubmit.app@gmail.com";
const FROM_EMAIL = "Zubmit <noreply@zubmit.in>";

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

export async function sendAdminPaymentNotificationEmail(
  paymentType: "advance" | "final",
  customer: {
    full_name: string;
    email: string;
    phone: string | null;
    college_name: string | null;
    degree: string;
    specialization: string | null;
    semester: string | number;
    roll_no: string | null;
  },
  order: {
    id: string;
    title: string;
    subject: string;
    service_type: string;
    delivery_type: string;
    deadline: string;
    description: string | null;
    total_price: number;
    advance_amount: number;
    final_amount: number;
    pages?: number | null;
    front_page_info: string | null;
    material_note: string | null;
    reference_file_url: string | null;
  },
  payment: {
    amount: number;
    payment_method: string | null;
    cf_payment_id: string | null;
  }
) {
  const isAdvance = paymentType === "advance";
  const label = isAdvance ? "40% ADVANCE PAYMENT" : "60% FINAL PAYMENT";
  const tagColor = isAdvance ? "#f97316" : "#22c55e";
  const deadlineIST = new Date(order.deadline).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const paidAtIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `${isAdvance ? "New Order" : "Final Payment"} — ${order.subject} — ₹${payment.amount} — ${customer.full_name}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#e8722a;font-size:28px;font-weight:800;margin:0;">ZUBMIT</h1>
            <p style="color:${tagColor};font-size:14px;font-weight:600;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">${label} RECEIVED</p>
          </div>

          <!-- Payment Summary -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:2px solid ${tagColor};margin-bottom:16px;">
            <div style="text-align:center;margin-bottom:16px;">
              <p style="color:#999;font-size:13px;margin:0 0 4px;">${isAdvance ? "Advance" : "Final"} Amount Paid</p>
              <p style="color:${tagColor};font-size:36px;font-weight:800;margin:0;">₹${payment.amount}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Total Order Price</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;font-weight:600;">₹${order.total_price}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Advance (40%)</td><td style="color:${isAdvance ? tagColor : "#fff"};padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">₹${order.advance_amount}${isAdvance ? " PAID" : ""}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Final (60%)</td><td style="color:${!isAdvance ? tagColor : "#fff"};padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">₹${order.final_amount}${!isAdvance ? " PAID" : ""}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Payment Method</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${payment.payment_method || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Transaction ID</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${payment.cf_payment_id || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Paid At</td><td style="color:#f4954e;padding:6px 0;font-size:13px;text-align:right;font-weight:600;border-top:1px solid #222;">${paidAtIST}</td></tr>
            </table>
          </div>

          <!-- Customer Details -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">CUSTOMER DETAILS</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Name</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;font-weight:600;">${customer.full_name}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Email</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.email}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Phone</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.phone || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">College</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.college_name || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Degree</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.degree || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Specialization</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.specialization || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Semester</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.semester || "N/A"}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Roll No</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${customer.roll_no || "N/A"}</td></tr>
            </table>
          </div>

          <!-- Assignment Details -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">ASSIGNMENT DETAILS</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Order ID</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;font-weight:600;">${order.id}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Title</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${order.title}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Subject</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${order.subject}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Service</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${order.service_type.replace(/_/g, " ")}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Delivery</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${order.delivery_type || "Digital"}</td></tr>
              ${order.pages ? `<tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Pages</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${order.pages}</td></tr>` : ""}
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Deadline</td><td style="color:#ff4757;padding:6px 0;font-size:13px;text-align:right;font-weight:700;border-top:1px solid #222;">${deadlineIST}</td></tr>
            </table>
            ${order.description ? `<div style="margin-top:16px;padding:12px;background:#0a0a0a;border-radius:8px;border:1px solid #222;"><p style="color:#999;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">DESCRIPTION</p><p style="color:#ccc;font-size:13px;margin:0;line-height:1.5;">${order.description}</p></div>` : ""}
            ${order.front_page_info ? `<div style="margin-top:12px;padding:12px;background:#0a0a0a;border-radius:8px;border:1px solid #222;"><p style="color:#999;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">FRONT PAGE INFO</p><p style="color:#ccc;font-size:13px;margin:0;line-height:1.5;">${order.front_page_info}</p></div>` : ""}
            ${order.material_note ? `<div style="margin-top:12px;padding:12px;background:#0a0a0a;border-radius:8px;border:1px solid #222;"><p style="color:#999;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">MATERIAL NOTE</p><p style="color:#ccc;font-size:13px;margin:0;line-height:1.5;">${order.material_note}</p></div>` : ""}
            ${order.reference_file_url ? `<div style="margin-top:12px;"><a href="${order.reference_file_url}" style="display:inline-block;background:#e8722a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;font-size:13px;">Download Reference File</a></div>` : ""}
          </div>

          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#e8722a;font-size:13px;font-weight:600;">Open Admin Panel</a>
          </div>
        </div>
      </body>
      </html>
      `,
    });
    console.log(`[EMAIL] Admin ${paymentType} payment notification sent`);
  } catch (error) {
    console.error(`[EMAIL] Failed to send admin ${paymentType} payment notification:`, error);
  }
}
