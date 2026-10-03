"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Timer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { majorToMinor, minorToMajor } from "@/lib/currency";
import { payWhatYouWantMax } from "@/lib/pricing";
import AddToCartButton from "./AddToCartButton";

interface Props {
  item: { bookId: string; slug: string; title: string; currency: string; coverUrl: string | null };
  /** Current unit price (the minimum, for pay-what-you-want). */
  priceCents: number;
  /** Regular price while a launch offer runs. */
  regularCents: number | null;
  saleEndsAt: string | null;
  payWhatYouWant: boolean;
  withQuantity?: boolean;
}

function useCountdown(endIso: string | null) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!endIso) return;
    const end = new Date(endIso).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endIso]);
  return left;
}

/**
 * Price block on a product page: launch offer with countdown, and the
 * pay-what-you-want amount. Display only — the server re-prices at checkout.
 */
export default function ProductPurchase({ item, priceCents, regularCents, saleEndsAt, payWhatYouWant, withQuantity }: Props) {
  const t = useTranslations("store");
  const left = useCountdown(saleEndsAt);
  const minMajor = minorToMajor(priceCents, item.currency);
  const [amount, setAmount] = useState(String(minMajor));
  const chosenCents = majorToMinor(Number(amount || 0), item.currency);
  const amountOk = !payWhatYouWant || (Number.isFinite(chosenCents) && chosenCents >= priceCents && chosenCents <= payWhatYouWantMax(priceCents));
  const ended = left === 0;

  const d = left !== null ? Math.floor(left / 86_400_000) : 0;
  const h = left !== null ? Math.floor((left % 86_400_000) / 3_600_000) : 0;
  const m = left !== null ? Math.floor((left % 3_600_000) / 60_000) : 0;
  const s = left !== null ? Math.floor((left % 60_000) / 1000) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-3 mb-2">
        <span className="text-2xl font-bold text-gold">
          {priceCents === 0 && !payWhatYouWant ? t("free") : formatPrice(priceCents, item.currency)}
        </span>
        {regularCents !== null && !ended && (
          <span className="text-base text-text-muted line-through">{formatPrice(regularCents, item.currency)}</span>
        )}
        {payWhatYouWant && <span className="text-xs text-text-secondary">{t("pwyw_minimum")}</span>}
      </div>

      {saleEndsAt && left !== null && !ended && (
        <p className="text-sm text-gold mb-4 flex items-center gap-1.5" aria-live="off">
          <Timer className="w-4 h-4" />
          {t("offer_ends")} <span className="figure">{d > 0 ? `${d}d ` : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
        </p>
      )}
      {ended && <p className="text-sm text-text-muted mb-4">{t("offer_ended")}</p>}

      {payWhatYouWant && (
        <label className="block mb-4">
          <span className="block text-xs text-text-secondary mb-1">{t("pwyw_label", { currency: item.currency })}</span>
          <input
            type="number"
            min={minMajor}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40 px-3 py-2 rounded-md bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm figure"
          />
          {!amountOk && <span className="block text-xs text-red-400 mt-1">{t("pwyw_invalid", { min: formatPrice(priceCents, item.currency) })}</span>}
        </label>
      )}

      <div className={amountOk ? "" : "opacity-40 pointer-events-none"}>
        <AddToCartButton
          book={{
            ...item,
            priceCents: payWhatYouWant ? chosenCents : priceCents,
            ...(payWhatYouWant ? { amountCents: chosenCents } : {}),
          }}
          withQuantity={withQuantity}
          buyNow
        />
      </div>
    </div>
  );
}
