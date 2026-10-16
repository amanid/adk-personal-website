"use client";

import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <Container size="prose" className="py-20 md:py-28 min-h-[60vh]">
      <p className="eyebrow mb-5 tabular-nums">404</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">
        {t("not_found_title")}
      </h1>
      <p className="lede max-w-xl mb-10">{t("not_found_desc")}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/" size="lg">
          {t("go_home")}
        </ButtonLink>
        <ButtonLink href="/publications" variant="secondary" size="lg">
          {t("publications")}
        </ButtonLink>
      </div>
    </Container>
  );
}
