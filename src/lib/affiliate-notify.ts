/** Affiliate emails. Every interpolated value is escaped. */
import type { Affiliate } from "@prisma/client";
import { sendEmail, adminNotifyAddress } from "./email";
import { escapeHtml } from "./html";
import { emailShell, emailRow, emailButton } from "./email-layout";
import { appUrl } from "./orders";

const fr = (a: Pick<Affiliate, "locale">) => a.locale === "fr";
export const dashboardUrl = (a: Pick<Affiliate, "locale" | "dashboardToken">) =>
  `${appUrl()}/${fr(a) ? "fr" : "en"}/affiliates/dashboard/${a.dashboardToken}`;
export const referralUrl = (a: Pick<Affiliate, "code">) => `${appUrl()}/r/${a.code}`;

export async function notifyAdminOfApplication(a: Affiliate): Promise<void> {
  const to = await adminNotifyAddress();
  if (!to) return;
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:16px;">New affiliate application</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow("Name", escapeHtml(a.name))}
${emailRow("Email", escapeHtml(a.email))}
${a.website ? emailRow("Website", escapeHtml(a.website)) : ""}
${a.pitch ? emailRow("Plan", escapeHtml(a.pitch).replace(/\n/g, "<br>")) : ""}
</table>
${emailButton(escapeHtml(`${appUrl()}/en/admin/affiliates`), "Review applications")}`;
  await sendEmail(to, `Affiliate application: ${a.name}`, emailShell("Affiliates &middot; Admin", body));
}

export async function sendAffiliateWelcome(a: Affiliate): Promise<void> {
  const f = fr(a);
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${f ? "Bienvenue dans le programme d'affiliation" : "Welcome to the affiliate program"}</p>
<p style="margin:0 0 16px;">${f ? "Bonjour" : "Hello"} ${escapeHtml(a.name)}, ${
    f
      ? `votre candidature est acceptée. Vous touchez ${a.commissionPercent} % sur chaque vente de la boutique réalisée grâce à votre lien.`
      : `your application is approved. You earn ${a.commissionPercent}% on every store sale made through your link.`
  }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow(f ? "Votre lien" : "Your link", escapeHtml(referralUrl(a)))}
</table>
<p style="margin:0 0 16px;">${
    f
      ? "Votre tableau de bord privé vous permet de créer des liens vers chaque titre et de suivre vos clics, ventes et commissions."
      : "Your private dashboard builds links to any title and tracks your clicks, sales and commissions."
  }</p>
${emailButton(escapeHtml(dashboardUrl(a)), f ? "Ouvrir mon tableau de bord" : "Open my dashboard")}`;
  await sendEmail(
    a.email,
    f ? "Votre lien d'affiliation est prêt" : "Your affiliate link is ready",
    emailShell(f ? "Affiliation" : "Affiliates", body)
  );
}
