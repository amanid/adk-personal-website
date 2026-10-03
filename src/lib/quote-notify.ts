/**
 * Quote emails. Every interpolated value is escaped. Client-facing mail goes
 * out in the quote's language.
 */
import type { Quote, QuoteStage } from "@prisma/client";
import { sendEmail, adminNotifyAddress } from "./email";
import { escapeHtml } from "./html";
import { emailShell, emailRow, emailButton } from "./email-layout";
import { appUrl } from "./orders";
import { formatPrice } from "./utils";

const fr = (q: Pick<Quote, "locale">) => q.locale === "fr";
const quoteUrl = (q: Pick<Quote, "locale" | "token">) => `${appUrl()}/${fr(q) ? "fr" : "en"}/quote/${q.token}`;
const adminUrl = () => `${appUrl()}/en/admin/quotes`;

function amounts(q: Quote): string {
  const f = fr(q);
  return [
    emailRow(f ? "Total" : "Total", escapeHtml(formatPrice(q.totalCents, q.currency))),
    q.depositCents > 0
      ? emailRow(
          f ? "Acompte" : "Deposit",
          escapeHtml(`${formatPrice(q.depositCents, q.currency)} (${q.depositPercent}%)`)
        )
      : "",
  ].join("");
}

/** The quote itself, with the link to review, accept and pay. */
export async function sendQuoteToClient(q: Quote): Promise<void> {
  const f = fr(q);
  const valid = q.validUntil
    ? new Intl.DateTimeFormat(f ? "fr-FR" : "en-GB", { dateStyle: "long", timeZone: "UTC" }).format(q.validUntil)
    : null;
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${escapeHtml(q.title)}</p>
<p style="margin:0 0 16px;">${f ? "Bonjour" : "Hello"} ${escapeHtml(q.clientName)}, ${
    f
      ? "voici la proposition dont nous avons parlé. Vous pouvez la consulter en détail, l'accepter et régler l'acompte en ligne."
      : "here is the proposal we discussed. You can review it in full, accept it and pay the deposit online."
  }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow(f ? "Référence" : "Reference", escapeHtml(q.number))}
${amounts(q)}
${valid ? emailRow(f ? "Valable jusqu'au" : "Valid until", escapeHtml(valid)) : ""}
</table>
${emailButton(escapeHtml(quoteUrl(q)), f ? "Consulter la proposition" : "Review the proposal")}`;
  await sendEmail(
    q.clientEmail,
    f ? `Proposition ${q.number} — ${q.title}` : `Proposal ${q.number} — ${q.title}`,
    emailShell(f ? "Conseil &middot; Proposition" : "Consulting &middot; Proposal", body)
  );
}

/** Ask the client for the remaining balance. */
export async function sendBalanceRequest(q: Quote, balanceCents: number): Promise<void> {
  const f = fr(q);
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${escapeHtml(q.title)}</p>
<p style="margin:0 0 16px;">${f ? "Bonjour" : "Hello"} ${escapeHtml(q.clientName)}, ${
    f ? "le solde de ce projet est désormais dû." : "the balance for this project is now due."
  }</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow(f ? "Référence" : "Reference", escapeHtml(q.number))}
${emailRow(f ? "Solde dû" : "Balance due", escapeHtml(formatPrice(balanceCents, q.currency)))}
</table>
${emailButton(escapeHtml(quoteUrl(q)), f ? "Régler le solde" : "Pay the balance")}`;
  await sendEmail(
    q.clientEmail,
    f ? `Solde dû — ${q.number}` : `Balance due — ${q.number}`,
    emailShell(f ? "Conseil &middot; Facture" : "Consulting &middot; Invoice", body)
  );
}

/** Client receipt + admin alert once a stage is paid. */
export async function sendQuotePaymentReceived(q: Quote, stage: QuoteStage, amountCents: number): Promise<void> {
  const f = fr(q);
  const what =
    stage === "DEPOSIT" ? (f ? "votre acompte" : "your deposit") : f ? "le solde" : "the balance";
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:18px;font-weight:bold;">${f ? "Paiement reçu" : "Payment received"}</p>
<p style="margin:0 0 16px;">${f ? "Merci" : "Thank you"}, ${escapeHtml(q.clientName)} — ${
    f ? `nous avons bien reçu ${what} pour` : `we've received ${what} for`
  } <strong style="color:#edeae3;">${escapeHtml(q.title)}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow(f ? "Référence" : "Reference", escapeHtml(q.number))}
${emailRow(f ? "Montant" : "Amount", escapeHtml(formatPrice(amountCents, q.currency)))}
</table>
${emailButton(escapeHtml(quoteUrl(q)), f ? "Voir le projet" : "View the project")}`;
  await sendEmail(
    q.clientEmail,
    f ? `Paiement reçu — ${q.number}` : `Payment received — ${q.number}`,
    emailShell(f ? "Conseil &middot; Reçu" : "Consulting &middot; Receipt", body)
  );
  await notifyAdmin(
    `${stage === "DEPOSIT" ? "Deposit" : "Balance"} paid: ${q.number} — ${q.clientName}`,
    `${stage === "DEPOSIT" ? "Deposit" : "Balance"} of ${formatPrice(amountCents, q.currency)} received for “${q.title}”.`,
    q
  );
}

/** A plain admin alert about a quote. */
export async function notifyAdmin(subject: string, text: string, q: Quote): Promise<void> {
  const to = await adminNotifyAddress();
  if (!to) return;
  const body = `
<p style="margin:0 0 16px;color:#edeae3;font-size:16px;">${escapeHtml(text)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
${emailRow("Client", `${escapeHtml(q.clientName)} &lt;${escapeHtml(q.clientEmail)}&gt;`)}
${q.company ? emailRow("Company", escapeHtml(q.company)) : ""}
${emailRow("Quote", escapeHtml(`${q.number} — ${q.title}`))}
${amounts(q)}
</table>
${emailButton(escapeHtml(adminUrl()), "Open quotes")}`;
  await sendEmail(to, subject, emailShell("Consulting &middot; Admin", body));
}
