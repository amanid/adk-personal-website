import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { formatMoney } from "./currency";
import { MOBILE_MONEY_NUMBER, whatsappLink, mobileMoneyLabel } from "./mobile-money";

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

interface ReceiptItem {
  title: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

interface ReceiptDownload {
  title: string;
  url: string;
}

interface OrderReceiptParams {
  to: string;
  name?: string | null;
  orderNumber: string;
  paidAt: Date;
  currency: string;
  totalCents: number;
  items: ReceiptItem[];
  downloads: ReceiptDownload[];
  receiptUrl: string;
}

function fmtMoney(minor: number, currency: string): string {
  return formatMoney(minor, currency);
}

interface OrderInvoiceParams {
  to: string;
  name?: string | null;
  orderNumber: string;
  currency: string;
  totalCents: number;
  items: ReceiptItem[];
  provider: string; // PaymentMethod enum value (WAVE/DJAMO/ORANGE_MONEY)
  receiptUrl: string;
}

/** Send an invoice requesting payment (mobile money) with WhatsApp instructions. */
export async function sendOrderInvoiceEmail(params: OrderInvoiceParams): Promise<void> {
  const html = buildOrderInvoiceEmail(params);
  await sendEmail(params.to, `Invoice — please complete payment · Order ${params.orderNumber}`, html);
}

function buildOrderInvoiceEmail({
  name,
  orderNumber,
  currency,
  totalCents,
  items,
  provider,
  receiptUrl,
}: OrderInvoiceParams): string {
  const total = fmtMoney(totalCents, currency);
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#f1f5f9;border-bottom:1px solid rgba(255,255,255,0.08);">${i.title}</td>
        <td style="padding:8px 0;font-size:14px;color:#8892a4;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">${i.quantity}</td>
        <td style="padding:8px 0;font-size:14px;color:#f1f5f9;text-align:right;border-bottom:1px solid rgba(255,255,255,0.08);">${fmtMoney(i.lineTotalCents, currency)}</td>
      </tr>`
    )
    .join("");

  const wa = whatsappLink(`Hello, here is my proof of payment for order ${orderNumber} (${total}).`);
  const providerLabel = mobileMoneyLabel(provider);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f1e;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#8892a4;">Bookstore &middot; Invoice</p>
        </td></tr>
        <tr><td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;">
          <p style="margin:0 0 4px;font-size:12px;color:#d4a843;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment required</p>
          <h2 style="margin:0 0 4px;font-size:20px;color:#f1f5f9;">Order ${orderNumber}</h2>
          <p style="margin:0 0 20px;font-size:14px;color:#8892a4;line-height:1.6;">Hello${name ? ` ${name}` : ""}, thank you for your order. To complete it, please pay the total below via mobile money, then send your proof of payment on WhatsApp so we can confirm it.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <th style="text-align:left;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Item</th>
              <th style="text-align:center;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Qty</th>
              <th style="text-align:right;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Amount</th>
            </tr>
            ${rows}
            <tr>
              <td style="padding-top:12px;font-size:15px;color:#f1f5f9;font-weight:700;">Total due</td>
              <td></td>
              <td style="padding-top:12px;font-size:15px;color:#d4a843;font-weight:700;text-align:right;">${total}</td>
            </tr>
          </table>

          <div style="background-color:#0a0f1e;border:1px solid rgba(212,168,67,0.2);border-radius:10px;padding:16px;margin:8px 0 20px;">
            <p style="margin:0 0 8px;font-size:13px;color:#8892a4;">Pay <strong style="color:#f1f5f9;">${total}</strong> via <strong style="color:#f1f5f9;">${providerLabel}</strong> (or Wave / Djamo / Orange Money) to:</p>
            <p style="margin:0;font-size:20px;color:#d4a843;font-weight:700;letter-spacing:0.5px;">${MOBILE_MONEY_NUMBER}</p>
          </div>

          <a href="${wa}" style="display:inline-block;padding:12px 24px;background-color:#25D366;color:#0a0f1e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Send proof of payment on WhatsApp</a>

          <p style="margin:20px 0 0;font-size:13px;color:#8892a4;line-height:1.6;">Once we confirm your payment, we'll email your secure download links. You can also track this order here:<br>
            <a href="${receiptUrl}" style="color:#d4a843;text-decoration:underline;">${receiptUrl}</a>
          </p>
        </td></tr>
        <tr><td style="text-align:center;padding-top:24px;"><p style="margin:0;font-size:12px;color:#4b5563;">Books are delivered digitally after payment is confirmed.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Send an order receipt with secure download links to the buyer. */
export async function sendOrderReceiptEmail(params: OrderReceiptParams): Promise<void> {
  const html = buildOrderReceiptEmail(params);
  await sendEmail(params.to, `Your receipt & downloads — Order ${params.orderNumber}`, html);
}

function buildOrderReceiptEmail({
  name,
  orderNumber,
  paidAt,
  currency,
  totalCents,
  items,
  downloads,
  receiptUrl,
}: OrderReceiptParams): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#f1f5f9;border-bottom:1px solid rgba(255,255,255,0.08);">${i.title}</td>
        <td style="padding:8px 0;font-size:14px;color:#8892a4;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">${i.quantity}</td>
        <td style="padding:8px 0;font-size:14px;color:#f1f5f9;text-align:right;border-bottom:1px solid rgba(255,255,255,0.08);">${fmtMoney(i.lineTotalCents, currency)}</td>
      </tr>`
    )
    .join("");

  const downloadButtons = downloads
    .map(
      (d) => `
      <tr>
        <td style="padding:6px 0;">
          <a href="${d.url}" style="display:inline-block;padding:10px 20px;background-color:#d4a843;color:#0a0f1e;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">⬇ Download “${d.title}”</a>
        </td>
      </tr>`
    )
    .join("");

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
          <tr>
            <td style="text-align:center;padding-bottom:24px;">
              <h1 style="margin:0;font-size:24px;color:#d4a843;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#8892a4;">Bookstore &middot; Payment Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#111827;border:1px solid rgba(212,168,67,0.2);border-radius:12px;padding:32px;">
              <p style="margin:0 0 4px;font-size:12px;color:#d4a843;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Thank you${name ? `, ${name}` : ""}!</p>
              <h2 style="margin:0 0 4px;font-size:20px;color:#f1f5f9;">Payment confirmed</h2>
              <p style="margin:0 0 20px;font-size:13px;color:#8892a4;">Order <strong style="color:#f1f5f9;">${orderNumber}</strong> &middot; ${paidAt.toUTCString()}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <th style="text-align:left;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Item</th>
                  <th style="text-align:center;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Qty</th>
                  <th style="text-align:right;font-size:11px;color:#8892a4;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Amount</th>
                </tr>
                ${rows}
                <tr>
                  <td style="padding-top:12px;font-size:15px;color:#f1f5f9;font-weight:700;">Total paid</td>
                  <td></td>
                  <td style="padding-top:12px;font-size:15px;color:#d4a843;font-weight:700;text-align:right;">${fmtMoney(totalCents, currency)}</td>
                </tr>
              </table>

              <p style="margin:20px 0 12px;font-size:14px;color:#f1f5f9;font-weight:600;">Your secure downloads</p>
              <p style="margin:0 0 12px;font-size:12px;color:#8892a4;line-height:1.6;">These links are private to you and expire after ${7} days. Please save your files after downloading.</p>
              <table role="presentation" cellpadding="0" cellspacing="0">${downloadButtons}</table>

              <p style="margin:24px 0 0;font-size:13px;color:#8892a4;line-height:1.6;">
                You can also view and re-download from your receipt page:<br>
                <a href="${receiptUrl}" style="color:#d4a843;text-decoration:underline;">${receiptUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">This receipt confirms your payment via PayPal. Keep it for your records.</p>
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
