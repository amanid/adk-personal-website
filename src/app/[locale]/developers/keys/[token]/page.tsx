import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { normalizeLocale } from "@/lib/seo";
import { currentPeriod, effectivePlan, getApiSettings } from "@/lib/data-api";
import { keyByManageToken } from "@/lib/data-api-owner";
import KeyActions from "./KeyActions";

export const dynamic = "force-dynamic";
// A private bearer-token page: keep it out of search indexes.
export const metadata: Metadata = { title: "API key", robots: { index: false, follow: false } };

export default async function KeyPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const l = normalizeLocale(locale);
  const k = await keyByManageToken(token);
  if (!k) notFound();
  const t = await getTranslations({ locale: l, namespace: "developers" });
  const s = await getApiSettings();
  const plan = effectivePlan(k);
  const quota = plan === "PRO" ? s.proQuota : s.freeQuota;
  const used = (await prisma.apiUsage.findUnique({ where: { keyId_period: { keyId: k.id, period: currentPeriod() } } }))?.count ?? 0;
  const pct = Math.min(100, (used / quota) * 100);
  const date = (d: Date) => new Intl.DateTimeFormat(l === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(d);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <p className="eyebrow mb-3">{t("eyebrow")}</p>
      <h1 className="text-3xl font-semibold mb-6">{t("key_title")}</h1>
      {k.status === "REVOKED" ? (
        <p className="glass p-5 text-text-secondary">{t("status_revoked")}</p>
      ) : (
        <div className="glass p-6 space-y-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-text-muted">{t("key_prefix")}</dt><dd className="figure">{k.keyPrefix}…</dd></div>
            <div>
              <dt className="text-text-muted">{t("plan")}</dt>
              <dd>{plan === "PRO" ? t("pro") : t("free")}{plan === "PRO" && k.currentPeriodEnd && <span className="text-text-muted"> · {t("pro_active", { date: date(k.currentPeriodEnd) })}</span>}</dd>
            </div>
          </dl>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span>{t("usage")}</span>
              <span className="figure">{used.toLocaleString()} / {quota.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-navy overflow-hidden"><div className={`h-full ${pct > 90 ? "bg-gold" : "bg-signal"}`} style={{ width: `${pct}%` }} /></div>
            <p className="text-xs text-text-muted mt-1">{t("resets")}</p>
          </div>
          <KeyActions
            token={k.manageToken}
            keyId={k.id}
            isPro={plan === "PRO"}
            hasSubscription={!!k.paypalSubscriptionId}
            proPlanId={s.proPriceCents ? s.proPlanId : null}
          />
        </div>
      )}
    </div>
  );
}
