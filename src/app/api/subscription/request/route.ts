import { NextRequest, NextResponse } from "next/server";
import { subscriptionRequestSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";

const NOTIFY_EMAILS = [
  "amani_dieudonne@yahoo.fr",
  "amanidieudonnekonan@gmail.com",
];

const TIER_LABELS: Record<string, { en: string; fr: string }> = {
  DOCUMENT_ACCESS: { en: "Document Access ($9.99/mo or $99/yr)", fr: "Accès Documents (9,99 $/mois ou 99 $/an)" },
  DATA_ACCESS: { en: "Data Access ($14.99/mo or $149/yr)", fr: "Accès Données (14,99 $/mois ou 149 $/an)" },
  FULL_ACCESS: { en: "Full Access ($19.99/mo or $199/yr)", fr: "Accès Complet (19,99 $/mois ou 199 $/an)" },
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 3, windowSeconds: 300 });
  if (limited) return limited;

  const originBlocked = checkOrigin(request);
  if (originBlocked) return originBlocked;

  try {
    const body = await request.json();
    const parsed = subscriptionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, organization, tier, billing, message } = parsed.data;
    const tierLabel = TIER_LABELS[tier]?.en || tier;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="text-align:center;padding-bottom:30px;">
              <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">New Subscription Request</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;">
              <table width="100%" cellpadding="8" cellspacing="0">
                <tr><td style="color:#8892a4;font-size:13px;width:140px;">Name</td><td style="color:#f1f5f9;font-size:14px;">${escapeHtml(name)}</td></tr>
                <tr><td style="color:#8892a4;font-size:13px;">Email</td><td style="color:#f1f5f9;font-size:14px;"><a href="mailto:${escapeHtml(email)}" style="color:#d4a843;">${escapeHtml(email)}</a></td></tr>
                ${organization ? `<tr><td style="color:#8892a4;font-size:13px;">Organization</td><td style="color:#f1f5f9;font-size:14px;">${escapeHtml(organization)}</td></tr>` : ""}
                <tr><td style="color:#8892a4;font-size:13px;">Tier</td><td style="color:#d4a843;font-size:14px;font-weight:600;">${tierLabel}</td></tr>
                <tr><td style="color:#8892a4;font-size:13px;">Billing</td><td style="color:#f1f5f9;font-size:14px;">${billing === "yearly" ? "Yearly" : "Monthly"}</td></tr>
                ${message ? `<tr><td style="color:#8892a4;font-size:13px;vertical-align:top;">Message</td><td style="color:#f1f5f9;font-size:14px;line-height:1.5;">${escapeHtml(message)}</td></tr>` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:20px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">Sent from konanamanidieudonne.org subscription page</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send to both email addresses
    const subject = `Subscription Request: ${tierLabel} - ${name}`;
    await Promise.allSettled(
      NOTIFY_EMAILS.map((to) => sendEmail(to, subject, html))
    );

    // Also send confirmation to the requester
    const confirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="text-align:center;padding-bottom:30px;">
              <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#8892a4;">Research &amp; Data Services</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;text-align:center;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#f1f5f9;">Subscription Request Received</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#8892a4;line-height:1.6;">Thank you, ${escapeHtml(name)}! Your request for <strong style="color:#d4a843;">${tierLabel}</strong> (${billing}) has been received. I will review it and get back to you within 24 hours with access details and payment instructions.</p>
              <p style="margin:0;font-size:13px;color:#4b5563;">— KONAN Amani Dieudonn&eacute;</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await sendEmail(email, "Your Subscription Request — KONAN Amani Dieudonné", confirmHtml).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription request error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
