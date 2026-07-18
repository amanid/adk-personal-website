"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";

export default function CartButton({ compact = false }: { compact?: boolean }) {
  const { count, hydrated } = useCart();
  const t = useTranslations("store");

  return (
    <Link
      href="/store/cart"
      aria-label={t("cartAria", { count: hydrated ? count : 0 })}
      className="relative flex items-center gap-1 px-3 py-1.5 text-sm text-text-secondary hover:text-gold rounded-lg hover:bg-white/5 transition-all"
    >
      <ShoppingCart className="w-4 h-4" />
      {!compact && <span className="hidden sm:inline">{t("cart")}</span>}
      {hydrated && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-gold text-charcoal">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
