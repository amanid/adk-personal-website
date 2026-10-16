"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import {
  ShoppingCart,
  X,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import QuantitySelector from "./QuantitySelector";
import { buttonClass } from "@/components/ui/Button";

type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface StoreUIValue {
  openCart: () => void;
  closeCart: () => void;
  toast: (message: string, variant?: ToastVariant) => void;
}

const StoreUIContext = createContext<StoreUIValue | null>(null);

/** Cart drawer + toast layer. Mount once, inside CartProvider. */
export function StoreUIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), 3200);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  // Clean up any pending timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <StoreUIContext.Provider value={{ openCart, closeCart, toast }}>
      {children}
      <CartDrawer open={cartOpen} onClose={closeCart} />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </StoreUIContext.Provider>
  );
}

export function useStoreUI(): StoreUIValue {
  const ctx = useContext(StoreUIContext);
  // Tolerate use outside the provider (e.g. isolated tests) with no-ops.
  return (
    ctx ?? {
      openCart: () => {},
      closeCart: () => {},
      toast: () => {},
    }
  );
}

/* ── Cart drawer ── */

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("store");
  const { items, subtotalCents, currency, setQuantity, removeItem, hydrated } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll, close on Escape, and keep Tab inside the panel while
  // open. Without the trap, tabbing walks out of an aria-modal dialog into the
  // page behind it — which is still there, just visually covered — and a
  // keyboard user ends up operating a page they cannot see. Focus returns to
  // whatever opened the drawer on close.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        // Nothing to focus inside: keep focus on the panel rather than losing it.
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  const isEmpty = hydrated && items.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Panel */}
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t("cart")}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 h-full w-full max-w-md glass-strong border-l border-glass-border flex flex-col outline-none"
          >
            <header className="flex items-center justify-between p-5 border-b border-glass-border">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <ShoppingCart aria-hidden="true" className="w-5 h-5 text-gold" />
                {t("cart")}
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center min-h-11 min-w-11 rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary hover:bg-[var(--hover-wash)] transition-colors"
                aria-label={t("backToStore")}
              >
                <X aria-hidden="true" className="w-5 h-5" />
              </button>
            </header>

            {isEmpty ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ShoppingCart aria-hidden="true" className="w-10 h-10 text-text-muted mb-4" />
                <p className="font-display text-xl">{t("emptyTitle")}</p>
                <p className="text-sm text-text-secondary mt-1 mb-6">{t("emptySubtitle")}</p>
                <button type="button" onClick={onClose} className={buttonClass("primary", "md")}>
                  {t("backToStore")}
                </button>
                <Link
                  href="/store/orders"
                  onClick={onClose}
                  className="mt-3 inline-flex items-center min-h-11 text-sm text-text-secondary hover:text-gold transition-colors"
                >
                  {t("findMyOrders")}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 divide-y divide-glass-border">
                  {items.map((item) => (
                    <div key={item.bookId} className="flex gap-3 py-4">
                      <Link
                        href={`/store/${item.slug}`}
                        onClick={onClose}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="relative w-12 h-16 shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-navy border border-glass-border flex items-center justify-center"
                      >
                        {item.coverUrl ? (
                          <Image src={item.coverUrl} alt="" fill sizes="48px" className="object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-text-muted" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/store/${item.slug}`}
                          onClick={onClose}
                          className="font-display text-base leading-snug line-clamp-2 hover:text-gold transition-colors"
                        >
                          {item.title}
                        </Link>
                        <p className="font-mono tabular-nums text-sm text-text-secondary mt-0.5">
                          {item.priceCents === 0 ? t("free") : formatPrice(item.priceCents, item.currency)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(q) => setQuantity(item.bookId, q)}
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(item.bookId)}
                            className="flex items-center justify-center min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 rounded-[var(--radius-md)] text-text-muted hover:text-danger hover:bg-[var(--hover-wash)] transition-colors"
                            aria-label={`${t("remove")}: ${item.title}`}
                          >
                            <Trash2 aria-hidden="true" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="border-t border-glass-border p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t("subtotal")}</span>
                    <span className="font-mono tabular-nums font-medium">
                      {subtotalCents === 0 ? t("free") : formatPrice(subtotalCents, currency)}
                    </span>
                  </div>
                  <Link
                    href="/store/cart"
                    onClick={onClose}
                    className={buttonClass("primary", "lg", "w-full")}
                  >
                    {t("viewCartCheckout")}
                    <ArrowRight aria-hidden="true" className="w-4 h-4" />
                  </Link>
                  <button type="button" onClick={onClose} className={buttonClass("ghost", "md", "w-full")}>
                    {t("backToStore")}
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Toasts ── */

const TOAST_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const TOAST_ACCENT = {
  success: "text-success",
  error: "text-danger",
  info: "text-gold",
} as const;

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:top-auto sm:bottom-4 z-[80] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = TOAST_ICON[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto glass-strong border border-glass-border rounded-[var(--radius-md)] pl-4 pr-1 py-1 shadow-[var(--elev-md)] flex items-center gap-3 max-w-xs"
              role="status"
            >
              <Icon aria-hidden="true" className={`w-5 h-5 shrink-0 ${TOAST_ACCENT[toast.variant]}`} />
              <span className="text-sm flex-1 py-2">{toast.message}</span>
              <button
                onClick={() => onDismiss(toast.id)}
                type="button"
                className="flex items-center justify-center min-h-11 min-w-11 rounded-[var(--radius-md)] text-text-muted hover:text-text-primary shrink-0"
                aria-label="Dismiss"
              >
                <X aria-hidden="true" className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
