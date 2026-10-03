import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata, normalizeLocale, BASE_URL } from "@/lib/seo";
import { getApiSettings } from "@/lib/data-api";
import { formatPrice } from "@/lib/utils";
import { Check } from "lucide-react";
import ApiKeyForm from "./ApiKeyForm";

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
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
      <p className="eyebrow mb-3">{t("eyebrow")}</p>
      <h1 className="text-3xl md:text-5xl font-semibold mb-4">{t("title")}</h1>
      <p className="text-text-secondary text-lg max-w-2xl mb-12">{t("subtitle")}</p>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t("plans")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass p-6">
            <p className="font-semibold text-lg">{t("free")}</p>
            <p className="figure text-3xl my-2">$0</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              {[t("requests", { n: fmt(s?.freeQuota ?? 1000) }), t("per_minute", { n: s?.freePerMinute ?? 30 }), t("free_f1"), t("free_f2")].map((x) => (
                <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="glass p-6 border-gold/40">
            <p className="font-semibold text-lg">{t("pro")}</p>
            <p className="figure text-3xl my-2">
              {proOpen ? <>{formatPrice(s!.proPriceCents!, "USD")}<span className="text-base text-text-muted"> {t("per_month")}</span></> : "—"}
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              {[t("pro_f1"), t("requests", { n: fmt(s?.proQuota ?? 50000) }), t("per_minute", { n: s?.proPerMinute ?? 300 }), t("pro_f2")].map((x) => (
                <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />{x}</li>
              ))}
            </ul>
            <p className="text-xs text-text-muted mt-4">{proOpen ? t("upgrade_hint") : t("pro_soon")}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t("quickstart")}</h2>
        <pre className="figure text-xs md:text-sm bg-navy/60 rounded-md p-4 overflow-x-auto">{`curl -H "Authorization: Bearer adk_YOUR_KEY" \\
  "${BASE_URL}/api/v1/publications?q=trade&per_page=5"

# Python
import requests
r = requests.get("${BASE_URL}/api/v1/publications",
                 headers={"Authorization": "Bearer adk_YOUR_KEY"},
                 params={"category": "Africa Economics"})
print(r.json()["data"][0]["title"])`}</pre>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t("endpoints")}</h2>
        <table className="w-full text-sm">
          <tbody>
            {ENDPOINTS.map(([m, p, note]) => (
              <tr key={p} className="border-b border-glass-border">
                <td className="py-2 pr-4 figure text-gold">{m}</td>
                <td className="py-2 pr-4 figure">{p}</td>
                <td className="py-2 text-text-muted text-xs">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm mt-3">
          <a href="/api/v1/openapi.json" className="text-gold">{t("openapi")} →</a>
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-2">{t("ai_title")}</h2>
        <p className="text-sm text-text-secondary max-w-2xl mb-4">{t("ai_body")}</p>
        <dl className="text-sm space-y-2">
          <div>
            <dt className="text-text-muted text-xs">{t("ai_server")}</dt>
            <dd className="figure break-all">{BASE_URL}/api/mcp</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">{t("ai_llms")}</dt>
            <dd className="figure">
              <a href="/llms.txt" className="text-gold">/llms.txt</a> · <a href="/llms-full.txt" className="text-gold">/llms-full.txt</a>
            </dd>
          </div>
        </dl>
      </section>

      <section id="get-key">
        <h2 className="text-xl font-semibold mb-4">{t("get_key")}</h2>
        <ApiKeyForm />
      </section>
    </div>
  );
}
