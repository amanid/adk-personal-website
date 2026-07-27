"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Receipt,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Smartphone,
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  DollarSign,
  ShoppingBag,
  Package,
  Search,
  Mail,
  MailWarning,
  MailCheck,
  Calendar,
  Download,
  Hash,
  Gift,
} from "lucide-react";
import StatCard from "@/components/admin/charts/StatCard";
import { formatPrice } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { paymentMethodLabel } from "@/lib/mobile-money";

interface OrderItem {
  id: string;
  titleSnapshot: string;
  quantity: number;
  unitPriceCents: number;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  name: string | null;
  status: string;
  paymentMethod: string;
  paymentReference: string | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  totalCents: number;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  paidAt: string | null;
  invoiceEmailedAt: string | null;
  receiptEmailedAt: string | null;
  lastEmailError: string | null;
  createdAt: string;
  items: OrderItem[];
  _count: { downloads: number };
}

const STATUS_META: Record<
  string,
  { label: string; icon: typeof Clock; chip: string; bar: string }
> = {
  PAID: { label: "Paid", icon: CheckCircle2, chip: "bg-green-500/15 text-green-400", bar: "bg-green-400" },
  PENDING: { label: "Pending", icon: Clock, chip: "bg-amber-500/15 text-amber-400", bar: "bg-amber-400" },
  FAILED: { label: "Failed", icon: AlertCircle, chip: "bg-red-500/15 text-red-400", bar: "bg-red-400" },
  REFUNDED: { label: "Refunded", icon: RefreshCw, chip: "bg-purple-500/15 text-purple-400", bar: "bg-purple-400" },
  CANCELLED: { label: "Cancelled", icon: Ban, chip: "bg-gray-500/15 text-gray-400", bar: "bg-gray-500" },
};

const FILTERS = ["ALL", "PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.CANCELLED;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.chip}`}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function MethodChip({ method }: { method: string }) {
  const Icon = method === "PAYPAL" ? CreditCard : method === "FREE" ? Gift : Smartphone;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
      <Icon className="w-3 h-3" />
      {paymentMethodLabel(method)}
    </span>
  );
}

function InfoField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] text-text-secondary uppercase tracking-wide">{label}</div>
        <div className="text-sm text-text-primary break-all">{children}</div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await fetch(`/api/admin/orders`);
      const d = r.ok ? await r.json() : { orders: [] };
      setOrders(d.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, action: "mark-paid" | "cancel") => {
    if (action === "mark-paid" && !confirm("Confirm this payment and unlock the buyer's downloads?"))
      return;
    if (action === "cancel" && !confirm("Cancel this order?")) return;
    setBusyId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Action failed");
        return;
      }
      await fetchOrders();
    } catch {
      alert("Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const emailFailedCount = useMemo(
    () => orders.filter((o) => o.lastEmailError).length,
    [orders]
  );

  const summary = useMemo(() => {
    const paid = orders.filter((o) => o.status === "PAID");
    const byCurrency = new Map<string, number>();
    for (const o of paid) byCurrency.set(o.currency, (byCurrency.get(o.currency) || 0) + o.totalCents);
    return {
      revenueByCurrency: [...byCurrency.entries()]
        .map(([currency, cents]) => ({ currency, cents }))
        .sort((a, b) => b.cents - a.cents),
      paidCount: paid.length,
      pending: orders.filter((o) => o.status === "PENDING").length,
      total: orders.length,
    };
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "ALL" && o.status !== filter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (o.name || "").toLowerCase().includes(q) ||
        (o.paymentReference || "").toLowerCase().includes(q)
      );
    });
  }, [orders, filter, search]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-gold" />
            Orders
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage bookstore orders and confirm mobile-money payments.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-glass-border text-sm hover:border-gold/50 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-5">
          <DollarSign className="w-5 h-5 text-green-400 mb-2" />
          {summary.revenueByCurrency.length === 0 ? (
            <p className="text-2xl font-bold">—</p>
          ) : (
            <div className="space-y-0.5">
              {summary.revenueByCurrency.slice(0, 3).map((r) => (
                <p key={r.currency} className="text-lg font-bold leading-tight">
                  {formatMoney(r.cents, r.currency)}
                </p>
              ))}
              {summary.revenueByCurrency.length > 3 && (
                <p className="text-xs text-text-secondary">
                  +{summary.revenueByCurrency.length - 3} more
                </p>
              )}
            </div>
          )}
          <p className="text-text-secondary text-sm mt-1">Revenue (paid)</p>
        </div>
        <StatCard label="Paid orders" value={summary.paidCount} icon={ShoppingBag} color="text-gold" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} color="text-amber-400" />
        <StatCard label="Total orders" value={summary.total} icon={Package} color="text-blue-400" />
      </div>

      {/* Pending banner */}
      {summary.pending > 0 && (
        <div className="flex items-center gap-2 mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          <Clock className="w-4 h-4 shrink-0" />
          {summary.pending} order{summary.pending === 1 ? "" : "s"} awaiting your confirmation.
        </div>
      )}

      {/* Email failure banner */}
      {emailFailedCount > 0 && (
        <div className="flex items-start gap-2 mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
          <MailWarning className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {emailFailedCount} order{emailFailedCount === 1 ? "" : "s"} had an email delivery
            failure. Buyers may not have received their invoice or download links — check your
            SMTP settings, then use the buyer email to follow up.
          </span>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === s
                  ? "bg-gold text-charcoal font-medium"
                  : "border border-glass-border text-text-secondary hover:border-gold/50"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_META[s]?.label || s}
              <span className={`ml-1.5 ${filter === s ? "opacity-70" : "text-text-muted"}`}>
                {counts[s] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, email, name or reference…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy/50 border border-glass-border focus:border-gold/50 outline-none text-sm"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl h-[74px] animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">
          <Receipt className="w-10 h-10 mx-auto mb-3 text-gold/30" />
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((o) => {
            const isOpen = expanded === o.id;
            const meta = STATUS_META[o.status] || STATUS_META.CANCELLED;
            const initial = (o.name || o.email || "?").trim().charAt(0).toUpperCase();
            const units = o.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={o.id}
                className={`glass rounded-xl overflow-hidden transition-all ${
                  isOpen ? "ring-1 ring-gold/30" : ""
                }`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  {/* status accent */}
                  <span className={`w-1 self-stretch rounded-full ${meta.bar} shrink-0`} />
                  {/* avatar */}
                  <span className="w-10 h-10 rounded-full bg-gold/15 text-gold font-semibold flex items-center justify-center shrink-0">
                    {initial}
                  </span>
                  {/* main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{o.orderNumber}</span>
                      <StatusPill status={o.status} />
                      <MethodChip method={o.paymentMethod} />
                      {o.lastEmailError && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                          <MailWarning className="w-3 h-3" />
                          Email failed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1 truncate">
                      {o.name ? `${o.name} · ` : ""}
                      {o.email}
                    </p>
                  </div>
                  {/* right */}
                  <div className="text-right shrink-0">
                    <div className="font-bold">{formatPrice(o.totalCents, o.currency)}</div>
                    <div className="text-[11px] text-text-secondary">
                      {units} item{units === 1 ? "" : "s"} · {fmtDate(o.createdAt)}
                    </div>
                  </div>
                  <span className="text-text-muted shrink-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-glass-border/60 bg-navy/20 p-4 sm:p-5">
                    {/* action bar for pending */}
                    {o.status === "PENDING" && (
                      <div className="flex flex-wrap items-center gap-2 mb-4 rounded-lg border border-amber-400/25 bg-amber-400/5 p-3">
                        <span className="text-xs text-amber-300 flex-1 min-w-[160px]">
                          Confirm the payment{" "}
                          {o.paymentMethod !== "PAYPAL"
                            ? `(${paymentMethodLabel(o.paymentMethod)}${
                                o.paymentReference ? ` · ${o.paymentReference}` : ""
                              })`
                            : ""}{" "}
                          to unlock downloads.
                        </span>
                        <button
                          onClick={() => updateStatus(o.id, "mark-paid")}
                          disabled={busyId === o.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-500/90 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {busyId === o.id ? "Working…" : "Mark as paid"}
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, "cancel")}
                          disabled={busyId === o.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-glass-border text-text-secondary text-xs hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* info grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                      <InfoField icon={Hash} label="Order">
                        {o.orderNumber}
                      </InfoField>
                      <InfoField icon={Mail} label="Customer">
                        {o.name ? `${o.name} · ` : ""}
                        {o.email}
                      </InfoField>
                      <InfoField
                        icon={
                          o.paymentMethod === "PAYPAL"
                            ? CreditCard
                            : o.paymentMethod === "FREE"
                              ? Gift
                              : Smartphone
                        }
                        label="Payment"
                      >
                        {paymentMethodLabel(o.paymentMethod)}
                        {o.paymentReference ? ` · ${o.paymentReference}` : ""}
                      </InfoField>
                      <InfoField icon={Calendar} label="Placed">
                        {fmtDate(o.createdAt)} · {fmtTime(o.createdAt)}
                      </InfoField>
                      {o.paidAt && (
                        <InfoField icon={CheckCircle2} label="Paid">
                          {fmtDate(o.paidAt)} · {fmtTime(o.paidAt)}
                        </InfoField>
                      )}
                      <InfoField icon={Download} label="Downloads issued">
                        {o._count.downloads}
                      </InfoField>
                      <InfoField
                        icon={o.lastEmailError ? MailWarning : MailCheck}
                        label="Email"
                      >
                        {o.lastEmailError ? (
                          <span className="text-red-400">Failed — {o.lastEmailError}</span>
                        ) : o.receiptEmailedAt ? (
                          `Confirmation sent ${fmtDate(o.receiptEmailedAt)}`
                        ) : o.invoiceEmailedAt ? (
                          `Invoice sent ${fmtDate(o.invoiceEmailedAt)}`
                        ) : (
                          "—"
                        )}
                      </InfoField>
                      {o.paypalCaptureId && (
                        <InfoField icon={CreditCard} label="PayPal capture">
                          {o.paypalCaptureId}
                        </InfoField>
                      )}
                    </div>

                    {/* items */}
                    <div className="rounded-lg border border-glass-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-text-secondary text-left bg-white/[0.02]">
                            <th className="px-3 py-2 font-medium">Item</th>
                            <th className="px-3 py-2 font-medium text-center w-16">Qty</th>
                            <th className="px-3 py-2 font-medium text-right w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((i) => (
                            <tr key={i.id} className="border-t border-glass-border/40">
                              <td className="px-3 py-2">{i.titleSnapshot}</td>
                              <td className="px-3 py-2 text-center text-text-secondary">
                                {i.quantity}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatPrice(i.unitPriceCents * i.quantity, o.currency)}
                              </td>
                            </tr>
                          ))}
                          {o.discountCents > 0 && (
                            <>
                              <tr className="border-t border-glass-border">
                                <td className="px-3 py-2 text-text-secondary" colSpan={2}>
                                  Subtotal
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {formatPrice(o.subtotalCents, o.currency)}
                                </td>
                              </tr>
                              <tr>
                                <td className="px-3 py-1 text-green-400" colSpan={2}>
                                  Discount{o.couponCode ? ` (${o.couponCode})` : ""}
                                </td>
                                <td className="px-3 py-1 text-right text-green-400">
                                  −{formatPrice(o.discountCents, o.currency)}
                                </td>
                              </tr>
                            </>
                          )}
                          <tr className="border-t border-glass-border">
                            <td className="px-3 py-2 font-semibold" colSpan={2}>
                              Total
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gold">
                              {formatPrice(o.totalCents, o.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
