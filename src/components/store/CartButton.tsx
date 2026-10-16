"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart-context";
import { useStoreUI } from "./StoreUI";

export default function CartButton({ compact = false }: { compact?: boolean }) {
  const { count, hydrated } = useCart();
  const { openCart } = useStoreUI();
  const t = useTranslations("store");

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={t("cartAria", { count: hydrated ? count : 0 })}
      aria-haspopup="dialog"
      className="relative flex items-center justify-center gap-1 min-h-11 min-w-11 px-2.5 text-sm text-text-secondary hover:text-gold rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)] transition-colors"
    >
      <ShoppingCart aria-hidden="true" className="w-4 h-4" />
      {!compact && <span className="hidden sm:inline">{t("cart")}</span>}
      {hydrated && count > 0 && (
        <span className="absolute top-0 right-0 min-w-5 h-5 px-1 flex items-center justify-center font-mono tabular-nums text-xs font-semibold rounded-full bg-gold text-charcoal">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
