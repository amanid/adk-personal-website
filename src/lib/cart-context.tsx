"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface CartItem {
  bookId: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  coverUrl?: string | null;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  currency: string;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (bookId: string, quantity: number) => void;
  removeItem: (bookId: string) => void;
  clear: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "adk_bookstore_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // One-time hydration of the persisted cart from localStorage on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Sanitize: tolerate carts saved before fields like `currency` existed,
          // and drop malformed entries so nothing downstream can throw.
          const clean: CartItem[] = parsed
            .filter(
              (i): i is Record<string, unknown> =>
                !!i && typeof i === "object" && typeof i.bookId === "string"
            )
            .map((i) => ({
              bookId: String(i.bookId),
              slug: typeof i.slug === "string" ? i.slug : "",
              title: typeof i.title === "string" ? i.title : "",
              priceCents: Number.isFinite(i.priceCents as number) ? (i.priceCents as number) : 0,
              currency: typeof i.currency === "string" && i.currency ? (i.currency as string) : "USD",
              coverUrl: typeof i.coverUrl === "string" ? (i.coverUrl as string) : null,
              quantity:
                Number.isFinite(i.quantity as number) && (i.quantity as number) > 0
                  ? Math.min(99, Math.floor(i.quantity as number))
                  : 1,
            }));
          setItems(clean);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      // A cart holds a single currency; adding a book in a different currency
      // starts a fresh cart in that currency (keeps the total coherent).
      if (prev.length > 0 && prev[0].currency !== item.currency) {
        return [{ ...item, quantity: Math.min(99, Math.max(1, quantity)) }];
      }
      const existing = prev.find((i) => i.bookId === item.bookId);
      if (existing) {
        return prev.map((i) =>
          i.bookId === item.bookId
            ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(99, Math.max(1, quantity)) }];
    });
  }, []);

  const setQuantity = useCallback((bookId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.bookId !== bookId);
      return prev.map((i) =>
        i.bookId === bookId ? { ...i, quantity: Math.min(99, quantity) } : i
      );
    });
  }, []);

  const removeItem = useCallback((bookId: string) => {
    setItems((prev) => prev.filter((i) => i.bookId !== bookId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    const currency = items[0]?.currency ?? "USD";
    return { items, count, subtotalCents, currency, addItem, setQuantity, removeItem, clear, hydrated };
  }, [items, addItem, setQuantity, removeItem, clear, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
