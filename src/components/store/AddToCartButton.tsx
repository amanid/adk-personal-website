"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useCart, type CartItem } from "@/lib/cart-context";
import QuantitySelector from "./QuantitySelector";

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
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(book, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem(book, qty);
    router.push("/store/cart");
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {withQuantity && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Quantity</span>
          <QuantitySelector value={qty} onChange={setQty} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gold/40 text-gold font-medium hover:bg-gold/10 transition-all"
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          {added ? "Added" : "Add to cart"}
        </button>
        {buyNow && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all"
          >
            Buy now
          </button>
        )}
      </div>
    </div>
  );
}
