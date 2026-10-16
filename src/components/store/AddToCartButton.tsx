"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useStoreUI } from "./StoreUI";
import QuantitySelector from "./QuantitySelector";
import { buttonClass } from "@/components/ui/Button";

interface AddToCartButtonProps {
  book: Omit<CartItem, "quantity">;
  withQuantity?: boolean;
  buyNow?: boolean;
  className?: string;
}

export default function AddToCartButton({
  book,
  withQuantity = false,
  buyNow = false,
  className = "",
}: AddToCartButtonProps) {
  const { addItem, items, currency } = useCart();
  const { openCart, toast } = useStoreUI();
  const router = useRouter();
  const t = useTranslations("store");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  // Adding a book in a different currency starts a fresh cart (a single order
  // can't mix currencies). Warn instead of silently discarding the old cart.
  const wouldSwitchCurrency = items.length > 0 && currency !== book.currency;

  const handleAdd = () => {
    addItem(book, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (wouldSwitchCurrency) {
      toast(t("cartCurrencySwitched", { currency: book.currency }), "info");
    } else {
      toast(t("addedToCart"));
    }
    openCart();
  };

  const handleBuyNow = () => {
    addItem(book, qty);
    router.push("/store/cart");
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {withQuantity && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary" aria-hidden="true">{t("quantity")}</span>
          <QuantitySelector value={qty} onChange={setQty} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className={buttonClass("secondary", "md", "flex-1 min-w-[9rem]")}
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {added ? t("added") : t("addToCart")}
        </button>
        {buyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            className={buttonClass("primary", "md", "flex-1 min-w-[9rem]")}
          >
            {t("buyNow")}
          </button>
        )}
      </div>
      {/* Screen-reader confirmation when an item is added. */}
      <span aria-live="polite" className="sr-only">
        {added ? t("addedAnnounce") : ""}
      </span>
    </div>
  );
}
