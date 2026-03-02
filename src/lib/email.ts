import nodemailer from "nodemailer";
import { prisma } from "./prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@konanamanidieudonne.org",
    to,
    subject,
    html,
  });
}

interface NotifyParams {
  title: string;
  excerpt: string;
  url: string;
  type: "blog" | "publication";
}

export async function notifySubscribers({ title, excerpt, url, type }: NotifyParams) {
  const subscribers = await prisma.subscriber.findMany({
    where: { confirmed: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullUrl = url.startsWith("http") ? url : `${appUrl}${url}`;
  const typeLabel = type === "blog" ? "Blog Post" : "Publication";

  for (const subscriber of subscribers) {
    const unsubscribeUrl = `${appUrl}/api/subscribe?token=${subscriber.token}&action=unsubscribe`;
    const html = buildNotificationEmail({
      title,
      excerpt,
      url: fullUrl,
      type: typeLabel,
      unsubscribeUrl,
    });

    try {
      await sendEmail(
        subscriber.email,
        `New ${typeLabel}: ${title}`,
        html
      );
    } catch (error) {
      console.error(`Failed to send notification to ${subscriber.email}:`, error);
    }
  }
}

interface EmailTemplateParams {
  title: string;
  excerpt: string;
  url: string;
  type: string;
  unsubscribeUrl: string;
}

function buildNotificationEmail({ title, excerpt, url, type, unsubscribeUrl }: EmailTemplateParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="text-align:center;padding-bottom:30px;">
              <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#8892a4;">Research &amp; Insights</p>
            </td>
          </tr>
          <!-- Content Card -->
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;">
              <p style="margin:0 0 8px;font-size:12px;color:#d4a843;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${type}</p>
              <h2 style="margin:0 0 16px;font-size:22px;color:#f1f5f9;line-height:1.3;">${title}</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#8892a4;line-height:1.6;">${excerpt}</p>
              <a href="${url}" style="display:inline-block;padding:12px 28px;background-color:#d4a843;color:#0a0f1e;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Read Now</a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding-top:30px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                You received this because you subscribed to updates.<br>
                <a href="${unsubscribeUrl}" style="color:#8892a4;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildConfirmationEmail(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="text-align:center;padding-bottom:30px;">
              <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#8892a4;">Research &amp; Insights</p>
            </td>
          </tr>
          <!-- Content Card -->
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;text-align:center;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#f1f5f9;">Confirm Your Subscription</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#8892a4;line-height:1.6;">Click the button below to confirm your email and start receiving notifications when new research and insights are published.</p>
              <a href="${confirmUrl}" style="display:inline-block;padding:12px 28px;background-color:#d4a843;color:#0a0f1e;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Confirm Subscription</a>
              <p style="margin:24px 0 0;font-size:12px;color:#4b5563;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
