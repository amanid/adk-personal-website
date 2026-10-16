"use client";

import { useTranslations, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import ResearchTimeline from "@/components/publications/ResearchTimeline";

export default function ResearchClient() {
  const t = useTranslations("research");
  const locale = useLocale();

  return (
    <div className="pt-16 md:pt-24 pb-24">
      <Container size="prose">
        <header className="mb-12">
          <p className="eyebrow mb-4">{t("timeline_title")}</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
          <p className="lede mb-8">{t("subtitle")}</p>
          <ButtonLink href="/publications" variant="secondary">
            {t("view_publications")}
            <ArrowRight aria-hidden className="w-4 h-4" />
          </ButtonLink>
        </header>

        <section aria-labelledby="research-timeline" className="hairline pt-10">
          <h2 id="research-timeline" className="sr-only">
            {t("timeline_title")}
          </h2>
          <ResearchTimeline locale={locale} />
        </section>
      </Container>
    </div>
  );
}
