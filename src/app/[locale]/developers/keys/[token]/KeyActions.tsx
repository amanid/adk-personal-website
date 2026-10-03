"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import PayPalSubscribeButton from "@/components/payments/PayPalSubscribeButton";

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
      {flash && <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>{flash.text}</p>}
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
      <div className="flex flex-wrap gap-2 text-sm">
        <button onClick={() => confirm(t("rotate_confirm")) && call("/rotate", "POST", t("rotated"))} className="px-4 py-2 rounded-md border border-glass-border">
          {t("rotate")}
        </button>
        {isPro && hasSubscription && (
          <button onClick={() => confirm(t("cancel_pro_confirm")) && call("/pro", "DELETE", "OK")} className="px-4 py-2 rounded-md border border-glass-border">
            {t("cancel_pro")}
          </button>
        )}
        <button onClick={() => confirm(t("revoke_confirm")) && call("/revoke", "POST", t("revoked"))} className="px-4 py-2 rounded-md border border-glass-border text-red-400">
          {t("revoke")}
        </button>
      </div>
    </div>
  );
}
