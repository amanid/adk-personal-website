import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";
import LinkBuilder from "./LinkBuilder";

export const dynamic = "force-dynamic";
// A private bearer-token page: keep it out of search indexes.
export const metadata: Metadata = { title: "Affiliate dashboard", robots: { index: false, follow: false } };

export default async function AffiliateDashboard({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const l = normalizeLocale(locale);
  if (!token || token.length > 100) notFound();
  const a = await prisma.affiliate.findUnique({ where: { dashboardToken: token } });
  if (!a) notFound();
  const t = await getTranslations({ locale: l, namespace: "affiliate" });

  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [clicks30, sales, commissions, books, bundles] = await Promise.all([
    prisma.affiliateClick.count({ where: { affiliateId: a.id, createdAt: { gte: since } } }),
    prisma.order.count({ where: { affiliateId: a.id, status: "PAID" } }),
    prisma.affiliateCommission.findMany({
      where: { affiliateId: a.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, amountCents: true, currency: true, status: true, createdAt: true, order: { select: { orderNumber: true } } },
    }),
    a.status === "APPROVED"
      ? prisma.book.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { slug: true, title: true, titleFr: true } })
      : [],
    a.status === "APPROVED"
      ? prisma.bundle.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { slug: true, title: true, titleFr: true } })
      : [],
  ]);

  // Totals per currency and status (a commission is in its order's currency).
  const totals = new Map<string, Record<string, number>>();
  for (const c of commissions) {
    const row = totals.get(c.currency) ?? { PENDING: 0, APPROVED: 0, PAID: 0 };
    if (c.status in row) row[c.status] += c.amountCents;
    totals.set(c.currency, row);
  }
  const date = (d: Date) => new Intl.DateTimeFormat(l === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium" }).format(d);
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const targets = [
    { label: t("home_page"), path: `/${l}` },
    { label: t("store_page"), path: `/${l}/store` },
    ...books.map((b) => ({ label: l === "fr" && b.titleFr ? b.titleFr : b.title, path: `/${l}/store/${b.slug}` })),
    ...bundles.map((b) => ({ label: `📦 ${l === "fr" && b.titleFr ? b.titleFr : b.title}`, path: `/${l}/store/bundles/${b.slug}` })),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <p className="eyebrow mb-3">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold mb-1">{t("dash_title")}</h1>
      <p className={`mb-8 ${a.status === "APPROVED" ? "text-green-400" : "text-amber-400"}`}>
        {a.name} · {t(`dash_status_${a.status}`)}
      </p>

      {a.status === "APPROVED" && (
        <>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              [t("rate"), `${a.commissionPercent}%`],
              [t("clicks_30"), String(clicks30)],
              [t("sales"), String(sales)],
              [
                t("earned"),
                [...totals.entries()]
                  .map(([cur, r]) => formatPrice(r.PENDING + r.APPROVED + r.PAID, cur))
                  .join(" + ") || formatPrice(0, "USD"),
              ],
            ].map(([k, v]) => (
              <div key={k} className="glass p-4">
                <dt className="text-xs text-text-muted mb-1">{k}</dt>
                <dd className="figure text-2xl">{v}</dd>
              </div>
            ))}
          </dl>

          <LinkBuilder base={base} code={a.code} targets={targets} />

          {totals.size > 0 && (
            <div className="glass p-5 mt-6 grid grid-cols-3 gap-4 text-sm">
              {(["PENDING", "APPROVED", "PAID"] as const).map((st) => (
                <div key={st}>
                  <p className="text-text-muted">{t(st.toLowerCase())}</p>
                  <p className="figure">
                    {[...totals.entries()].map(([cur, r]) => formatPrice(r[st], cur)).join(" + ")}
                  </p>
                </div>
              ))}
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">{t("recent")}</h2>
            {commissions.length === 0 ? (
              <p className="text-sm text-text-secondary">{t("none_yet")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-glass-border">
                    <th className="py-2 pr-3 font-medium">{t("col_date")}</th>
                    <th className="py-2 pr-3 font-medium">{t("col_order")}</th>
                    <th className="py-2 pr-3 font-medium text-right">{t("col_amount")}</th>
                    <th className="py-2 font-medium">{t("col_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-glass-border/60">
                      <td className="py-2 pr-3">{date(c.createdAt)}</td>
                      <td className="py-2 pr-3 figure text-text-secondary">{c.order.orderNumber}</td>
                      <td className="py-2 pr-3 figure text-right">{formatPrice(c.amountCents, c.currency)}</td>
                      <td className="py-2 text-text-secondary">{c.status === "VOID" ? "—" : t(c.status.toLowerCase())}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
