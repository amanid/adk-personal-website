"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, ChevronDown, ChevronRight, Check, X, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { mobileMoneyLabel } from "@/lib/mobile-money";

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
  totalCents: number;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
  _count: { downloads: number };
}

const STATUSES = ["ALL", "PAID", "PENDING", "FAILED", "REFUNDED", "CANCELLED"];

const statusColor: Record<string, string> = {
  PAID: "bg-green-500/15 text-green-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  FAILED: "bg-red-500/15 text-red-400",
  REFUNDED: "bg-purple-500/15 text-purple-400",
  CANCELLED: "bg-gray-500/15 text-gray-400",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const q = filter === "ALL" ? "" : `?status=${filter}`;
    try {
      const r = await fetch(`/api/admin/orders${q}`);
      const d = r.ok ? await r.json() : { orders: [] };
      setOrders(d.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

  const paidRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-6 h-6 text-gold" />
          Orders
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {orders.length} orders shown · {formatPrice(paidRevenue)} paid
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === s
                ? "bg-gold text-charcoal font-medium"
                : "border border-glass-border text-text-secondary hover:border-gold/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-text-secondary">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center text-text-secondary">No orders found.</div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{o.orderNumber}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          statusColor[o.status] || "bg-gray-500/15 text-gray-400"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {o.email} · {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{formatPrice(o.totalCents, o.currency)}</div>
                    <div className="text-xs text-text-secondary">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-glass-border/50 text-sm">
                    <div className="grid sm:grid-cols-2 gap-2 py-3 text-xs text-text-secondary">
                      <div>
                        Customer: <span className="text-text-primary">{o.name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        Payment:{" "}
                        <span className="text-text-primary inline-flex items-center gap-1">
                          {o.paymentMethod !== "PAYPAL" && <Smartphone className="w-3 h-3" />}
                          {o.paymentMethod === "PAYPAL"
                            ? "PayPal"
                            : mobileMoneyLabel(o.paymentMethod)}
                        </span>
                      </div>
                      {o.paymentReference && (
                        <div className="break-all">
                          Reference:{" "}
                          <span className="text-text-primary">{o.paymentReference}</span>
                        </div>
                      )}
                      <div>
                        Downloads issued:{" "}
                        <span className="text-text-primary">{o._count.downloads}</span>
                      </div>
                      {o.paidAt && (
                        <div>
                          Paid at:{" "}
                          <span className="text-text-primary">
                            {new Date(o.paidAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {o.paypalCaptureId && (
                        <div className="break-all">
                          PayPal capture:{" "}
                          <span className="text-text-primary">{o.paypalCaptureId}</span>
                        </div>
                      )}
                    </div>

                    {/* Manual confirmation actions for pending orders */}
                    {o.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2 pb-3">
                        <button
                          onClick={() => updateStatus(o.id, "mark-paid")}
                          disabled={busyId === o.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as paid
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, "cancel")}
                          disabled={busyId === o.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-glass-border text-text-secondary text-xs hover:text-red-400 hover:border-red-400/40 transition-all disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}
                    <table className="w-full">
                      <tbody>
                        {o.items.map((i) => (
                          <tr key={i.id} className="border-t border-glass-border/40">
                            <td className="py-2">{i.titleSnapshot}</td>
                            <td className="py-2 text-center text-text-secondary">×{i.quantity}</td>
                            <td className="py-2 text-right">
                              {formatPrice(i.unitPriceCents * i.quantity, o.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
