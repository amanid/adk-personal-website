import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { getApiSettings } from "@/lib/data-api";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";
import ApiKeyForm from "./ApiKeyForm";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "developers" });
  return buildPageMetadata({ locale: l, path: "/developers", title: t("meta_title"), description: t("meta_description"), ogTitle: t("meta_title"), ogSubtitle: t("eyebrow") });
}

const ENDPOINTS = [
  ["GET", "/api/v1/publications", "?q=&category=&year=&type=&page=&per_page="],
  ["GET", "/api/v1/publications/{slug}", ""],
  ["GET", "/api/v1/datasets", ""],
  ["GET", "/api/v1/datasets/{slug}/download", "Pro"],
  ["GET", "/api/v1/usage", ""],
];

export default async function DevelopersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const l = normalizeLocale(locale);
  const t = await getTranslations({ locale: l, namespace: "developers" });
  const s = await getApiSettings().catch(() => null);
  const proOpen = !!(s?.proPriceCents && s.proPlanId);
  const fmt = (n: number) => n.toLocaleString(l === "fr" ? "fr-FR" : "en-US");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
      <p className="eyebrow mb-4">{t("eyebrow")}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
      <p className="lede max-w-2xl mb-14">{t("subtitle")}</p>

      <section className="mb-16" aria-labelledby="dev-plans">
        <h2 id="dev-plans" className="h-section mb-6">{t("plans")}</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="font-display text-2xl">{t("free")}</h3>
            <p className="font-mono tabular-nums text-3xl my-3">$0</p>
            <ul className="space-y-2 text-sm text-text-secondary pt-4 hairline">
              {[t("requests", { n: fmt(s?.freeQuota ?? 1000) }), t("per_minute", { n: s?.freePerMinute ?? 30 }), t("free_f1"), t("free_f2")].map((x) => (
                <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden />{x}</li>
              ))}
            </ul>
          </div>
          <div className={cn("card p-6", proOpen && "card-feature")}>
            <h3 className="font-display text-2xl">{t("pro")}</h3>
            <p className="font-mono tabular-nums text-3xl my-3">
              {proOpen ? <>{formatPrice(s!.proPriceCents!, "USD")}<span className="text-base text-text-muted"> {t("per_month")}</span></> : "—"}
            </p>
            <ul className="space-y-2 text-sm text-text-secondary pt-4 hairline">
              {[t("pro_f1"), t("requests", { n: fmt(s?.proQuota ?? 50000) }), t("per_minute", { n: s?.proPerMinute ?? 300 }), t("pro_f2")].map((x) => (
                <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" aria-hidden />{x}</li>
              ))}
            </ul>
            <p className="text-sm text-text-muted mt-4">{proOpen ? t("upgrade_hint") : t("pro_soon")}</p>
            <p className="text-sm text-text-muted mt-2">
              {t("pro_included")}{" "}
              <Link href="/subscribe" className="text-gold hover:text-gold-light underline underline-offset-4">
                {t("pro_included_link")}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16 pt-12 hairline" aria-labelledby="dev-quickstart">
        <h2 id="dev-quickstart" className="h-section mb-6">{t("quickstart")}</h2>
        <pre tabIndex={0} className="font-mono text-xs md:text-sm bg-navy border border-glass-border rounded-[var(--radius-md)] p-4 overflow-x-auto">{`curl -H "Authorization: Bearer adk_YOUR_KEY" \\
  "${BASE_URL}/api/v1/publications?q=trade&per_page=5"

# Python
import requests
r = requests.get("${BASE_URL}/api/v1/publications",
                 headers={"Authorization": "Bearer adk_YOUR_KEY"},
                 params={"category": "Africa Economics"})
print(r.json()["data"][0]["title"])`}</pre>
      </section>

      <section className="mb-16 pt-12 hairline" aria-labelledby="dev-endpoints">
        <h2 id="dev-endpoints" className="h-section mb-6">{t("endpoints")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <tbody>
              {ENDPOINTS.map(([m, p, note]) => (
                <tr key={p} className="border-b border-glass-border">
                  <td className="py-3 pr-4 font-mono text-gold">{m}</td>
                  <td className="py-3 pr-4 font-mono whitespace-nowrap">{p}</td>
                  <td className="py-3 font-mono text-text-muted text-xs">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm mt-3">
          <a href="/api/v1/openapi.json" className="inline-flex items-center min-h-11 text-gold hover:text-gold-light">
            {t("openapi")} →
          </a>
        </p>
      </section>

      <section className="mb-16 pt-12 hairline" aria-labelledby="dev-ai">
        <h2 id="dev-ai" className="h-section mb-4">{t("ai_title")}</h2>
        <p className="lede max-w-2xl mb-6">{t("ai_body")}</p>
        <dl className="text-sm space-y-4">
          <div>
            <dt className="text-text-muted text-sm">{t("ai_server")}</dt>
            <dd className="font-mono break-all">{BASE_URL}/api/mcp</dd>
          </div>
          <div>
            <dt className="text-text-muted text-sm">{t("ai_llms")}</dt>
            <dd className="font-mono flex flex-wrap gap-x-4">
              <a href="/llms.txt" className="inline-flex items-center min-h-11 text-gold hover:text-gold-light">/llms.txt</a>
              <a href="/llms-full.txt" className="inline-flex items-center min-h-11 text-gold hover:text-gold-light">/llms-full.txt</a>
            </dd>
          </div>
        </dl>
      </section>

      <section id="get-key" className="pt-12 hairline" aria-labelledby="dev-key">
        <h2 id="dev-key" className="h-section mb-6">{t("get_key")}</h2>
        <ApiKeyForm />
      </section>
    </div>
  );
}
