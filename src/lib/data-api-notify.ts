import { sendEmail } from "./email";
import { escapeHtml } from "./html";
import { emailShell, emailRow, emailButton } from "./email-layout";
import { appUrl } from "./orders";

export const keyManageUrl = (token: string) => `${appUrl()}/en/developers/keys/${token}`;

/** Deliver a (new or rotated) API key. The key is never stored, only emailed. */
export async function sendApiKeyEmail(p: { to: string; name: string; key: string; manageToken: string; rotated?: boolean }) {
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${p.rotated ? "Your new API key" : "Your API key"}</p>
<p style="margin:0 0 16px;">Hello ${escapeHtml(p.name)}, ${p.rotated ? "your key was rotated; the old one no longer works." : "here is your key for the Data &amp; Research API."} Keep it secret — anyone with it can use your quota.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow("API key", `<code style="font-family:monospace;color:#edeae3;">${escapeHtml(p.key)}</code>`)}
${emailRow("Use it as", `<code style="font-family:monospace;">Authorization: Bearer &lt;key&gt;</code>`)}
</table>
<p style="margin:0 0 16px;">Usage, upgrades and key rotation are on your key page (bookmark it):</p>
${emailButton(escapeHtml(keyManageUrl(p.manageToken)), "Manage your key")}
<p style="margin:16px 0 0;font-size:13px;">Docs: <a href="${escapeHtml(`${appUrl()}/en/developers`)}" style="color:#ea5536;">${escapeHtml(`${appUrl()}/en/developers`)}</a></p>`;
  await sendEmail(p.to, p.rotated ? "Your new API key" : "Your Data & Research API key", emailShell("Developers", body));
}
