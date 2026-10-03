"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Plus, Save, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { majorToMinor, minorToMajor, SUPPORTED_CURRENCY_CODES } from "@/lib/currency";
import { effectivePrice } from "@/lib/pricing";
import FileUpload from "@/components/admin/FileUpload";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";

interface BookOption {
  id: string;
  title: string;
  kind: string;
  status: string;
  currency: string;
  priceCents: number;
  salePriceCents: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  payWhatYouWant: boolean;
}
interface Bundle {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  priceCents: number;
  currency: string;
  coverImageId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  sortOrder: number;
  items: { bookId: string }[];
  _count: { orderItems: number };
}
const blank = {
  id: undefined as string | undefined,
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  price: "",
  currency: "USD",
  coverImageId: "",
  status: "DRAFT" as Bundle["status"],
  featured: false,
  sortOrder: 0,
  bookIds: [] as string[],
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [form, setForm] = useState<typeof blank | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await send("/api/admin/bundles", "GET");
      setBundles(d.bundles);
      setBooks(d.books);
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  }, []);
  useEffect(() => {
    // Initial fetch on mount; state is only set after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const separate = form ? form.bookIds.reduce((s, id) => s + (bookById.get(id) ? effectivePrice(bookById.get(id)!).priceCents : 0), 0) : 0;
  const priceCents = form ? majorToMinor(Number(form.price || 0), form.currency) : 0;

  const save = async () => {
    if (!form) return;
    setFlash(null);
    try {
      const body = {
        title: form.title,
        titleFr: form.titleFr,
        description: form.description,
        descriptionFr: form.descriptionFr,
        priceCents,
        currency: form.currency,
        coverImageId: form.coverImageId,
        status: form.status,
        featured: form.featured,
        sortOrder: Number(form.sortOrder) || 0,
        bookIds: form.bookIds,
      };
      if (form.id) await send(`/api/admin/bundles/${form.id}`, "PUT", body);
      else await send("/api/admin/bundles", "POST", body);
      setForm(null);
      setFlash({ ok: true, text: "Bundle saved." });
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-gold" /> Bundles
        </h1>
        {!form && (
          <button onClick={() => setForm({ ...blank })} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
            <Plus className="w-4 h-4" /> New bundle
          </button>
        )}
      </div>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
          {flash.text}
        </p>
      )}

      {form && (
        <div className="glass-strong p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-text-secondary">
              Title (EN)
              <input className={INPUT} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Title (FR)
              <input className={INPUT} value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Description (EN)
              <textarea rows={4} className={INPUT} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Description (FR)
              <textarea rows={4} className={INPUT} value={form.descriptionFr} onChange={(e) => setForm({ ...form, descriptionFr: e.target.value })} />
            </label>
          </div>

          <div>
            <p className="text-xs text-text-secondary mb-2">Products in this bundle ({form.currency} only)</p>
            <div className="grid sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
              {books
                .filter((b) => b.currency === form.currency)
                .map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-navy-light cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-gold"
                      checked={form.bookIds.includes(b.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bookIds: e.target.checked ? [...form.bookIds, b.id] : form.bookIds.filter((x) => x !== b.id),
                        })
                      }
                    />
                    <span className="flex-1 truncate">
                      {b.title}
                      {b.status !== "PUBLISHED" && <span className="text-xs text-amber-400"> (not published)</span>}
                    </span>
                    <span className="figure text-text-muted">{formatPrice(effectivePrice(b).priceCents, b.currency)}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <label className="text-xs text-text-secondary">
              Bundle price
              <input type="text" inputMode="decimal" className={INPUT} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Currency
              <select className={INPUT} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value, bookIds: [] })}>
                {SUPPORTED_CURRENCY_CODES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-text-secondary">
              Status
              <select className={INPUT} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Bundle["status"] })}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <div className="text-sm">
              <p className="text-text-secondary">
                Bought separately: <span className="figure">{formatPrice(separate, form.currency)}</span>
              </p>
              <p className={priceCents > 0 && priceCents < separate ? "text-green-400" : "text-amber-400"}>
                {priceCents > 0 && priceCents < separate
                  ? `Buyer saves ${formatPrice(separate - priceCents, form.currency)} (${Math.round(((separate - priceCents) / separate) * 100)}%)`
                  : "Price it below the separate total"}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <p className="text-xs text-text-secondary mb-1">Cover (optional — otherwise the products&apos; covers are fanned out)</p>
              <FileUpload
                accept="image/*"
                label="Bundle cover"
                currentUrl={form.coverImageId ? `/api/uploads/${form.coverImageId}` : undefined}
                onUpload={(url) => setForm({ ...form, coverImageId: url ? url.split("/").pop() || "" : "" })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm mt-6">
              <input type="checkbox" className="accent-gold" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
              <Save className="w-4 h-4" /> Save bundle
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded-md border border-glass-border text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {bundles.length === 0 && !form ? (
        <div className="glass p-10 text-center text-text-secondary text-sm">No bundles yet.</div>
      ) : (
        bundles.map((b) => {
          const sep = b.items.reduce((s, i) => s + (bookById.get(i.bookId) ? effectivePrice(bookById.get(i.bookId)!).priceCents : 0), 0);
          return (
            <div key={b.id} className="glass p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {b.title}{" "}
                  <span className="text-xs text-text-muted">
                    ({b.status.toLowerCase()} · {b.items.length} products · {b._count.orderItems} sold)
                  </span>
                </p>
                <p className="text-sm text-text-secondary">
                  {formatPrice(b.priceCents, b.currency)}
                  {sep > b.priceCents && ` · saves ${formatPrice(sep - b.priceCents, b.currency)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: b.id,
                      title: b.title,
                      titleFr: b.titleFr || "",
                      description: b.description,
                      descriptionFr: b.descriptionFr || "",
                      price: String(minorToMajor(b.priceCents, b.currency)),
                      currency: b.currency,
                      coverImageId: b.coverImageId || "",
                      status: b.status,
                      featured: b.featured,
                      sortOrder: b.sortOrder,
                      bookIds: b.items.map((i) => i.bookId),
                    })
                  }
                  className="px-3 py-1.5 text-sm rounded-md border border-glass-border"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${b.title}"?`)) return;
                    try {
                      const r = await send(`/api/admin/bundles/${b.id}`, "DELETE");
                      setFlash({ ok: true, text: r.message || "Deleted." });
                      await load();
                    } catch (e) {
                      setFlash({ ok: false, text: (e as Error).message });
                    }
                  }}
                  className="px-3 py-1.5 text-sm rounded-md border border-glass-border text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
