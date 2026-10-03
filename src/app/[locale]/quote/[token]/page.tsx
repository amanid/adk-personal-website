import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/lib/seo";
import { quoteByToken } from "@/lib/quote-access";
import { amountDue, isQuoteExpired, parseItems } from "@/lib/quotes";
import { formatPrice } from "@/lib/utils";
import QuoteActions from "./QuoteActions";

export const dynamic = "force-dynamic";

// A private bearer-token page: keep it out of search indexes.
export const metadata: Metadata = { title: "Proposal", robots: { index: false, follow: false } };

export default async function QuotePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const l = normalizeLocale(locale);
  const q = await quoteByToken(token);
  // A draft hasn't been sent: it doesn't exist as far as the client knows.
  if (!q || q.status === "DRAFT") notFound();

  const t = await getTranslations({ locale: l, namespace: "quote" });
  const items = parseItems(q.items);
  const expired = isQuoteExpired(q);
  const due = amountDue(q);
  const date = (d: Date) =>
    new Intl.DateTimeFormat(l === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long", timeZone: "UTC" }).format(d);
  const balanceCents = q.totalCents - q.depositCents;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <p className="eyebrow mb-3">{t("eyebrow")}</p>
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">{q.title}</h1>
      <p className="text-text-secondary mb-8">{expired ? t("status_EXPIRED") : t(`status_${q.status}`)}</p>

      <div className="glass p-6 md:p-8 space-y-8">
        <dl className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-text-muted">{t("reference")}</dt>
            <dd className="figure">{q.number}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t("prepared_for")}</dt>
            <dd>
              {q.clientName}
              {q.company && <span className="text-text-secondary"> · {q.company}</span>}
            </dd>
          </div>
          {q.validUntil && (
            <div>
              <dt className="text-text-muted">{t("valid_until")}</dt>
              <dd>{date(q.validUntil)}</dd>
            </div>
          )}
        </dl>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t("scope")}</h2>
          {/* Plain text from the admin, rendered as text (never as HTML). */}
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">{q.scope}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">{t("items")}</h2>
          <table className="w-full text-sm">
            <tbody>
              {items.map((i, n) => (
                <tr key={n} className="border-b border-glass-border">
                  <td className="py-2.5 pr-4 text-text-secondary">{i.description}</td>
                  <td className="py-2.5 text-right figure whitespace-nowrap">{formatPrice(i.amountCents, q.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 pr-4 font-semibold">{t("total")}</td>
                <td className="pt-3 text-right figure font-semibold">{formatPrice(q.totalCents, q.currency)}</td>
              </tr>
              {q.depositCents > 0 && q.depositCents < q.totalCents && (
                <>
                  <tr>
                    <td className="pt-1 pr-4 text-text-secondary">
                      {t("deposit", { pct: q.depositPercent })}
                      {q.depositPaidAt && <span className="text-green-400"> · {t("paid")}</span>}
                    </td>
                    <td className="pt-1 text-right figure text-text-secondary">{formatPrice(q.depositCents, q.currency)}</td>
                  </tr>
                  <tr>
                    <td className="pt-1 pr-4 text-text-secondary">
                      {t("balance")}
                      {q.status === "PAID" && <span className="text-green-400"> · {t("paid")}</span>}
                    </td>
                    <td className="pt-1 text-right figure text-text-secondary">{formatPrice(balanceCents, q.currency)}</td>
                  </tr>
                </>
              )}
            </tfoot>
          </table>
        </section>

        {q.acceptedAt && q.acceptedName && (
          <p className="text-xs text-text-muted">{t("accepted_on", { name: q.acceptedName, date: date(q.acceptedAt) })}</p>
        )}
        {expired && <p className="text-sm text-amber-400">{t("expired_help")}</p>}
      </div>

      <QuoteActions
        token={q.token}
        canDecide={q.status === "SENT" && !expired}
        due={due}
        currency={q.currency}
      />

      <p className="text-xs text-text-muted mt-8">{t("questions")}</p>
    </div>
  );
}
