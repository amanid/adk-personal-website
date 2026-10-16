import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale } from "@/lib/seo";
import { getAffiliateSettings } from "@/lib/affiliates";
import AffiliateApplyForm from "./AffiliateApplyForm";
import { Check } from "lucide-react";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "affiliate" });
  return buildPageMetadata({
    locale: l,
    path: "/affiliates",
    title: t("meta_title"),
    description: t("meta_description"),
    ogTitle: t("meta_title"),
    ogSubtitle: t("eyebrow"),
  });
}

export default async function AffiliatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "affiliate" });
  // Terms shown are the live settings, so the page can't promise a stale rate.
  const s = await getAffiliateSettings().catch(() => ({ defaultPercent: 20, cookieDays: 30, holdDays: 14 }));

  const steps = [
    [t("step1_title"), t("step1_text")],
    [t("step2_title"), t("step2_text", { days: s.cookieDays })],
    [t("step3_title"), t("step3_text")],
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
      <p className="eyebrow mb-4">{t("eyebrow")}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5 max-w-3xl">{t("title")}</h1>
      <p className="lede max-w-2xl mb-14">{t("subtitle", { pct: s.defaultPercent })}</p>

      <section className="mb-16" aria-labelledby="aff-how">
        <h2 id="aff-how" className="h-section mb-8">{t("how_title")}</h2>
        <ol className="grid md:grid-cols-3 gap-8">
          {steps.map(([title, text], i) => (
            <li key={title} className="pt-5 hairline">
              <p className="font-mono tabular-nums text-sm text-gold mb-3">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="font-display text-xl mb-2">{title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <section className="card p-6 md:p-8" aria-labelledby="aff-terms">
          <h2 id="aff-terms" className="font-display text-2xl mb-5">{t("terms_title")}</h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            {[
              t("term_rate", { pct: s.defaultPercent }),
              t("term_cookie", { days: s.cookieDays }),
              t("term_hold", { hold: s.holdDays }),
              t("term_self"),
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </section>
        <AffiliateApplyForm />
      </div>
    </div>
  );
}
