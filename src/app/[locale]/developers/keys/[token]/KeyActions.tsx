"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import PayPalSubscribeButton from "@/components/payments/PayPalSubscribeButton";
import { Button } from "@/components/ui/Button";

export default function KeyActions({
  token,
  keyId,
  isPro,
  hasSubscription,
  proPlanId,
}: {
  token: string;
  keyId: string;
  isPro: boolean;
  hasSubscription: boolean;
  proPlanId: string | null;
}) {
  const t = useTranslations("developers");
  const router = useRouter();
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const base = `/api/developers/keys/${encodeURIComponent(token)}`;

  const call = async (path: string, method: string, ok: string) => {
    setFlash(null);
    const res = await fetch(`${base}${path}`, { method });
    const d = await res.json().catch(() => ({}));
    setFlash({ ok: res.ok, text: res.ok ? ok : d.error || t("error") });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-4 border-t border-glass-border pt-5">
      {flash && (
        <p
          role={flash.ok ? "status" : "alert"}
          className={`text-sm rounded-[var(--radius-md)] p-3 border ${
            flash.ok ? "text-success bg-success/10 border-success/30" : "text-danger bg-danger/10 border-danger/30"
          }`}
        >
          {flash.text}
        </p>
      )}
      {!isPro && proPlanId && (
        <div>
          <p className="font-medium mb-2">{t("go_pro")}</p>
          <PayPalSubscribeButton
            planId={proPlanId}
            userId={keyId}
            onActivated={() => router.refresh()}
            labels={{ loading: t("pp_loading"), error: t("pp_error"), verifying: t("pp_verifying") }}
            activateUrl={`${base}/pro`}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => confirm(t("rotate_confirm")) && call("/rotate", "POST", t("rotated"))}>
          {t("rotate")}
        </Button>
        {isPro && hasSubscription && (
          <Button type="button" variant="secondary" onClick={() => confirm(t("cancel_pro_confirm")) && call("/pro", "DELETE", "OK")}>
            {t("cancel_pro")}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => confirm(t("revoke_confirm")) && call("/revoke", "POST", t("revoked"))}
          className="text-danger border-danger/40 hover:border-danger"
        >
          {t("revoke")}
        </Button>
      </div>
    </div>
  );
}
