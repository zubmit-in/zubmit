import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "zubmit.app@gmail.com";
const FROM_EMAIL = "Zubmit <noreply@zubmit.in>";

// =============================================
// EMAIL 1: Worker Accepted Task
// =============================================
export async function sendTaskAcceptedEmail(
  workerProfile: {
    full_name: string;
    contact: string;
    university: string;
    roll_no: string;
    degree: string;
    specialization: string;
    accommodation_type: string;
    tower_no?: number;
    tower_room_no?: string;
    block_no?: string;
    block_room_no?: string;
    upi_qr_url: string;
  },
  task: {
    title: string;
    subject: string;
    degree: string;
    specialization: string;
    semester: string;
    service_type: string;
    delivery_type: string;
    worker_pay: number;
    worker_deadline: string;
    real_deadline: string;
  }
) {
  const location =
    workerProfile.accommodation_type === "tower"
      ? `Tower ${workerProfile.tower_no} — Room ${workerProfile.tower_room_no}`
      : `Block ${workerProfile.block_no} — Room ${workerProfile.block_room_no}`;

  const workerDeadlineIST = new Date(task.worker_deadline).toLocaleString(
    "en-IN",
    { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }
  );
  const realDeadlineIST = new Date(task.real_deadline).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    console.log(`[EMAIL] Sending to ${ADMIN_EMAIL} from ${FROM_EMAIL}`);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Task Accepted — ${task.title} — ${workerProfile.full_name}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#e8722a;font-size:28px;font-weight:800;margin:0;">ZUBMIT</h1>
            <p style="color:#22d98a;font-size:14px;font-weight:600;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">TASK ACCEPTED</p>
          </div>

          <!-- Worker Profile -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">WORKER PROFILE</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Name</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;font-weight:600;">${workerProfile.full_name}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Contact</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.contact}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">University</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.university}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Roll No</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.roll_no}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Degree</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.degree}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Specialization</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.specialization}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Location</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${location}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">UPI QR</td><td style="padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;"><a href="${workerProfile.upi_qr_url}" style="color:#e8722a;">View Image</a></td></tr>
            </table>
          </div>

          <!-- Task Details -->
          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">ASSIGNMENT DETAILS</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Title</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;font-weight:600;">${task.title}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Subject</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.subject}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Degree</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.degree}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Specialization</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.specialization}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Semester</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.semester}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Service</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.service_type.replace(/_/g, " ")}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Delivery</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.delivery_type}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Worker Pay</td><td style="color:#22d98a;padding:6px 0;font-size:13px;text-align:right;font-weight:700;border-top:1px solid #222;">₹${task.worker_pay}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Worker Deadline</td><td style="color:#f4954e;padding:6px 0;font-size:13px;text-align:right;font-weight:600;border-top:1px solid #222;">${workerDeadlineIST}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Actual Client Deadline</td><td style="color:#ff4757;padding:6px 0;font-size:13px;text-align:right;font-weight:600;border-top:1px solid #222;">${realDeadlineIST}</td></tr>
            </table>
          </div>

          <div style="text-align:center;margin-top:24px;">
            <p style="color:#666;font-size:12px;">Track in Zubmit Admin Panel</p>
          </div>
        </div>
      </body>
      </html>
      `,
    });
    console.log("[EMAIL] Task accepted email sent:", result);
  } catch (error) {
    console.error("[EMAIL] Failed to send task accepted email:", error);
  }
}

// =============================================
// EMAIL 2: Digital Assignment Submitted
// =============================================
export async function sendDigitalSubmissionEmail(
  workerProfile: {
    full_name: string;
    contact: string;
    university: string;
    roll_no: string;
  },
  task: {
    title: string;
    subject: string;
    service_type: string;
  },
  fileUrl: string,
  submittedAt: string
) {
  const submittedIST = new Date(submittedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    console.log(`[EMAIL] Sending to ${ADMIN_EMAIL} from ${FROM_EMAIL}`);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `Assignment Submitted — ${task.title} — ${workerProfile.full_name}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#e8722a;font-size:28px;font-weight:800;margin:0;">ZUBMIT</h1>
            <p style="color:#22d98a;font-size:14px;font-weight:600;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">ASSIGNMENT SUBMITTED</p>
          </div>

          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">WORKER</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Name</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;">${workerProfile.full_name}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Contact</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.contact}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">University</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.university}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Roll No</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${workerProfile.roll_no}</td></tr>
            </table>
          </div>

          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;margin-bottom:16px;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">TASK</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Title</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;">${task.title}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Subject</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.subject}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Service</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.service_type.replace(/_/g, " ")}</td></tr>
            </table>
          </div>

          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">FILE</p>
            <a href="${fileUrl}" style="display:block;background:#e8722a;color:#fff;text-decoration:none;padding:12px;text-align:center;border-radius:8px;font-weight:600;font-size:14px;">Download Submitted File</a>
            <p style="color:#666;font-size:12px;margin:12px 0 0;text-align:center;">Submitted at: ${submittedIST}</p>
          </div>
        </div>
      </body>
      </html>
      `,
    });
    console.log("[EMAIL] Digital submission email sent:", result);
  } catch (error) {
    console.error("[EMAIL] Failed to send digital submission email:", error);
  }
}

// =============================================
// EMAIL 3: Physical Assignment Completed
// =============================================
export async function sendPhysicalCompleteEmail(
  workerProfile: {
    full_name: string;
    contact: string;
    university: string;
    roll_no: string;
    accommodation_type: string;
    tower_no?: number;
    tower_room_no?: string;
    block_no?: string;
    block_room_no?: string;
  },
  task: {
    title: string;
    subject: string;
    service_type: string;
  },
  completedAt: string
) {
  const location =
    workerProfile.accommodation_type === "tower"
      ? `Tower ${workerProfile.tower_no} — Room ${workerProfile.tower_room_no}`
      : `Block ${workerProfile.block_no} — Room ${workerProfile.block_room_no}`;

  const completedIST = new Date(completedAt).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  try {
    console.log(`[EMAIL] Sending to ${ADMIN_EMAIL} from ${FROM_EMAIL}`);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `COLLECT NOW — ${task.title} — ${workerProfile.full_name}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="color:#e8722a;font-size:28px;font-weight:800;margin:0;">ZUBMIT</h1>
            <p style="color:#ff4757;font-size:16px;font-weight:700;margin:8px 0 0;letter-spacing:0.1em;text-transform:uppercase;">COLLECT NOW — PHYSICAL ASSIGNMENT READY</p>
          </div>

          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:2px solid #ff4757;margin-bottom:16px;">
            <p style="color:#ff4757;font-size:15px;font-weight:700;margin:0 0 20px;">Physical assignment is ready for collection.</p>

            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">COLLECTION DETAILS</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:8px 0;font-size:14px;">Student</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;font-weight:700;">${workerProfile.full_name}</td></tr>
              <tr><td style="color:#999;padding:8px 0;font-size:14px;border-top:1px solid #222;">Contact</td><td style="color:#22d98a;padding:8px 0;font-size:14px;text-align:right;font-weight:700;border-top:1px solid #222;">${workerProfile.contact} ← CALL BEFORE GOING</td></tr>
              <tr><td style="color:#999;padding:8px 0;font-size:14px;border-top:1px solid #222;">Location</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;font-weight:700;border-top:1px solid #222;">${location}</td></tr>
              <tr><td style="color:#999;padding:8px 0;font-size:14px;border-top:1px solid #222;">University</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;border-top:1px solid #222;">${workerProfile.university}</td></tr>
              <tr><td style="color:#999;padding:8px 0;font-size:14px;border-top:1px solid #222;">Roll No</td><td style="color:#fff;padding:8px 0;font-size:14px;text-align:right;border-top:1px solid #222;">${workerProfile.roll_no}</td></tr>
            </table>
          </div>

          <div style="background:#1a1a1a;border-radius:12px;padding:24px;border:1px solid #333;">
            <p style="color:#f4954e;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">ASSIGNMENT</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="color:#999;padding:6px 0;font-size:13px;">Title</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;">${task.title}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Subject</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.subject}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Service</td><td style="color:#fff;padding:6px 0;font-size:13px;text-align:right;border-top:1px solid #222;">${task.service_type.replace(/_/g, " ")}</td></tr>
              <tr><td style="color:#999;padding:6px 0;font-size:13px;border-top:1px solid #222;">Completed At</td><td style="color:#f4954e;padding:6px 0;font-size:13px;text-align:right;font-weight:600;border-top:1px solid #222;">${completedIST}</td></tr>
            </table>
          </div>
        </div>
      </body>
      </html>
      `,
    });
    console.log("[EMAIL] Physical complete email sent:", result);
  } catch (error) {
    console.error("[EMAIL] Failed to send physical complete email:", error);
  }
}
