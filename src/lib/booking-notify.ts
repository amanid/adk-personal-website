/**
 * Booking emails: the client's confirmation (with a calendar invite) and the
 * consultant's alert. Every interpolated value is escaped.
 */
import type { Booking, ServicePackage } from "@prisma/client";
import { sendEmail, adminNotifyAddress } from "./email";
import { escapeHtml } from "./html";
import { getBookingSettings } from "./booking";
import { appUrl } from "./orders";

type BookingWithPackage = Booking & { package: ServicePackage };

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 text escaping, then 75-octet line folding. */
function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (Buffer.byteLength(rest) > 75) {
    let cut = 75;
    while (Buffer.byteLength(rest.slice(0, cut)) > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function bookingIcs(b: BookingWithPackage, organizerEmail: string | null): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//konanamanidieudonne.org//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${b.id}@konanamanidieudonne.org`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(b.startsAt)}`,
    `DTEND:${icsDate(b.endsAt)}`,
    `SUMMARY:${icsText(`${b.package.title} — KONAN Amani Dieudonné`)}`,
    `DESCRIPTION:${icsText(
      [b.meetingUrl ? `Join: ${b.meetingUrl}` : "The meeting link will follow by email.", b.notes ? `Notes: ${b.notes}` : ""]
        .filter(Boolean)
        .join("\n")
    )}`,
    ...(b.meetingUrl ? [`LOCATION:${icsText(b.meetingUrl)}`, `URL:${icsText(b.meetingUrl)}`] : []),
    ...(organizerEmail ? [`ORGANIZER;CN=KONAN Amani Dieudonné:mailto:${organizerEmail}`] : []),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

function formatInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
}

function shell(label: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#111110;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111110;"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="text-align:center;padding-bottom:24px;">
<h1 style="margin:0;font-size:22px;color:#edeae3;font-weight:bold;">KONAN Amani Dieudonn&eacute;</h1>
<p style="margin:4px 0 0;font-size:13px;color:#9a968c;">${label}</p></td></tr>
<tr><td style="background-color:#1a1a18;border:1px solid #2e2d2a;border-radius:8px;padding:32px;color:#c4bfb4;font-size:14px;line-height:1.6;">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

function row(k: string, v: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#9a968c;font-size:13px;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:4px 0;color:#edeae3;font-size:14px;">${v}</td></tr>`;
}

/** Client confirmation + consultant alert for a CONFIRMED (or flagged) booking. */
export async function sendBookingConfirmation(b: BookingWithPackage): Promise<void> {
  const settings = await getBookingSettings();
  const clientZone = b.clientTimezone || settings.timeZone;
  const manageUrl = `${appUrl()}/${b.locale === "fr" ? "fr" : "en"}/book/manage/${b.manageToken}`;
  const when = formatInZone(b.startsAt, clientZone);
  const organizer = (await adminNotifyAddress()) || null;

  const reschedule = b.status === "RESCHEDULE_NEEDED";
  const clientBody = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${
    reschedule ? "Payment received — let's find a new time" : "Your session is confirmed"
  }</p>
<p style="margin:0 0 16px;">Hello ${escapeHtml(b.name)}, ${
    reschedule
      ? "thank you for your payment. The time you picked was taken while it was being confirmed, so I'll contact you shortly to agree a new slot."
      : "thank you for booking. The details are below, and a calendar invite is attached."
  }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${row("Session", escapeHtml(b.package.title))}
${reschedule ? "" : row("When", escapeHtml(when))}
${row("Duration", `${b.package.durationMinutes} minutes`)}
${!reschedule && b.meetingUrl ? row("Join", `<a href="${escapeHtml(b.meetingUrl)}" style="color:#ea5536;">${escapeHtml(b.meetingUrl)}</a>`) : ""}
</table>
${!reschedule && !b.meetingUrl ? '<p style="margin:0 0 16px;">The meeting link will follow by email before the session.</p>' : ""}
<a href="${escapeHtml(manageUrl)}" style="display:inline-block;padding:11px 22px;background-color:#ea5536;color:#111110;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">View your booking</a>`;

  await sendEmail(
    b.email,
    reschedule ? `Payment received — ${b.package.title}` : `Confirmed: ${b.package.title} on ${when}`,
    shell("Consulting &middot; Booking", clientBody),
    reschedule ? undefined : [{ filename: "session.ics", content: bookingIcs(b, organizer), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
  );

  if (organizer) {
    const adminBody = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${
      reschedule ? "Paid booking needs a new time" : "New booking confirmed"
    }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${row("Client", `${escapeHtml(b.name)} &lt;${escapeHtml(b.email)}&gt;`)}
${b.company ? row("Company", escapeHtml(b.company)) : ""}
${row("Session", escapeHtml(b.package.title))}
${row("When", escapeHtml(formatInZone(b.startsAt, settings.timeZone)))}
${b.notes ? row("Notes", escapeHtml(b.notes).replace(/\n/g, "<br>")) : ""}
</table>
<a href="${escapeHtml(`${appUrl()}/en/admin/bookings`)}" style="color:#ea5536;">Open bookings</a>`;
    await sendEmail(
      organizer,
      `${reschedule ? "Reschedule needed" : "New booking"}: ${b.name} — ${b.package.title}`,
      shell("Consulting &middot; Admin", adminBody),
      reschedule ? undefined : [{ filename: "session.ics", content: bookingIcs(b, organizer), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
    );
  }
}
