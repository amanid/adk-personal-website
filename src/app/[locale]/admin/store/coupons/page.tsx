"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  Percent,
  BadgeDollarSign,
  X,
  Check,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { minorToMajor, SUPPORTED_CURRENCIES } from "@/lib/currency";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  percentOff: number | null;
  amountOffCents: number | null;
  currency: string | null;
  minSubtotalCents: number;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: string | null;
  _count?: { orders: number };
}

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-navy/50 border border-glass-border rounded-lg text-text-primary focus:border-gold/50 focus:outline-none text-sm";

const emptyForm = {
  code: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  percentOff: "10",
  amountOff: "",
  currency: "",
  minSubtotal: "",
  maxRedemptions: "",
  active: true,
  expiresAt: "",
};

type FormState = typeof emptyForm;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code,
      type: c.type,
      percentOff: c.percentOff != null ? String(c.percentOff) : "10",
      amountOff:
        c.amountOffCents != null && c.currency
          ? String(minorToMajor(c.amountOffCents, c.currency))
          : "",
      currency: c.currency || "",
      minSubtotal:
        c.minSubtotalCents > 0 && c.currency
          ? String(minorToMajor(c.minSubtotalCents, c.currency))
          : "",
      maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : "",
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
    });
    setEditingId(c.id);
    setError(null);
    setShowForm(true);
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        percentOff:
          form.type === "PERCENT" ? Number(form.percentOff) || undefined : undefined,
        amountOff: form.type === "FIXED" ? Number(form.amountOff) || undefined : undefined,
        currency: form.currency || undefined,
        minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : undefined,
        maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
        active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };
      const url = editingId ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not save coupon.");
        return;
      }
      setShowForm(false);
      await load();
    } catch {
      setError("Could not save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"? Orders that used it keep their records.`)) return;
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    if (res.ok) setCoupons((prev) => prev.filter((x) => x.id !== c.id));
  };

  const discountLabel = (c: Coupon) => {
    if (c.type === "PERCENT") return `${c.percentOff}% off`;
    if (c.amountOffCents != null && c.currency)
      return `${formatPrice(c.amountOffCents, c.currency)} off`;
    return "—";
  };

  const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();
  const isMaxed = (c: Coupon) =>
    c.maxRedemptions != null && c.timesRedeemed >= c.maxRedemptions;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] flex items-center gap-2">
            <Ticket className="w-6 h-6 text-gold" />
            Coupons
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Create discount codes buyers can apply at checkout.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all"
        >
          <Plus className="w-4 h-4" />
          New coupon
        </button>
      </div>

      {loading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : coupons.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Ticket className="w-10 h-10 mx-auto mb-3 text-gold/40" />
          <p className="text-text-secondary">No coupons yet. Create your first discount code.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => {
            const expired = isExpired(c);
            const maxed = isMaxed(c);
            const inactive = !c.active || expired || maxed;
            return (
              <div
                key={c.id}
                className={`glass rounded-xl p-4 flex flex-wrap items-center gap-4 ${
                  inactive ? "opacity-60" : ""
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    c.type === "PERCENT" ? "bg-gold/15 text-gold" : "bg-green-500/15 text-green-400"
                  }`}
                >
                  {c.type === "PERCENT" ? (
                    <Percent className="w-5 h-5" />
                  ) : (
                    <BadgeDollarSign className="w-5 h-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold tracking-wide">{c.code}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-navy/60 text-text-secondary">
                      {discountLabel(c)}
                    </span>
                    {!c.active && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                        Disabled
                      </span>
                    )}
                    {expired && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                        Expired
                      </span>
                    )}
                    {maxed && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                        Limit reached
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    {c.currency && <span>Currency: {c.currency}</span>}
                    {c.minSubtotalCents > 0 && c.currency && (
                      <span>Min: {formatPrice(c.minSubtotalCents, c.currency)}</span>
                    )}
                    <span>
                      Used: {c.timesRedeemed}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                    </span>
                    {c.expiresAt && (
                      <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 rounded-lg text-text-secondary hover:text-gold hover:bg-gold/5 transition-all"
                    aria-label="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/5 transition-all"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit coupon" : "New coupon"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER25"
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Discount type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["PERCENT", "FIXED"] as const).map((tp) => {
                    const active = form.type === tp;
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setForm({ ...form, type: tp })}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          active
                            ? "border-gold/60 bg-gold/10 text-gold"
                            : "border-glass-border text-text-secondary hover:border-gold/40"
                        }`}
                      >
                        {tp === "PERCENT" ? (
                          <Percent className="w-4 h-4" />
                        ) : (
                          <BadgeDollarSign className="w-4 h-4" />
                        )}
                        {tp === "PERCENT" ? "Percentage" : "Fixed amount"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.type === "PERCENT" ? (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Percent off (1–100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.percentOff}
                    onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Amount off</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.amountOff}
                      onChange={(e) => setForm({ ...form, amountOff: e.target.value })}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Currency</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className={INPUT_CLASS}
                    >
                      <option value="">Select…</option>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {form.type === "PERCENT" && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Restrict to currency (optional)
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className={INPUT_CLASS}
                  >
                    <option value="">Any currency</option>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Min. subtotal {form.currency ? `(${form.currency})` : ""}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.minSubtotal}
                    onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                    placeholder="0"
                    className={INPUT_CLASS}
                    disabled={!form.currency}
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Max redemptions</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxRedemptions}
                    onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                    placeholder="Unlimited"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1">Expires (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-gold w-4 h-4"
                />
                Active
              </label>

              {error && (
                <p className="text-sm text-red-400 border border-red-400/30 rounded-lg p-3">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submit}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-charcoal font-semibold hover:bg-gold-light transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving…" : editingId ? "Save changes" : "Create coupon"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg border border-glass-border text-text-secondary hover:text-text-primary transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
