/**
 * Shared layout for the transactional emails (bookings, quotes): a centred
 * card on the site's dark palette. Callers escape their own content.
 */

export function emailShell(label: string, body: string): string {
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

export function emailRow(k: string, v: string): string {
  return `<tr><td style="padding:4px 12px 4px 0;color:#9a968c;font-size:13px;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:4px 0;color:#edeae3;font-size:14px;">${v}</td></tr>`;
}

/** A primary call-to-action button; `href` and `label` are escaped by the caller. */
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;padding:11px 22px;background-color:#ea5536;color:#111110;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">${label}</a>`;
}
