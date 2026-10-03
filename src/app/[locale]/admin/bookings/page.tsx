"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2, Save, Check, X, Video, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import { formatPrice } from "@/lib/utils";
import { majorToMinor, minorToMajor, SUPPORTED_CURRENCY_CODES } from "@/lib/currency";

const INPUT =
  "w-full px-3 py-2 bg-navy/50 border border-glass-border rounded-md text-text-primary focus:border-gold/50 focus:outline-none text-sm";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Booking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  name: string;
  email: string;
  company: string | null;
  notes: string | null;
  meetingUrl: string | null;
  holdExpiresAt: string | null;
  package: { title: string; durationMinutes: number };
  order: { id: string; orderNumber: string; status: string; paymentMethod: string; totalCents: number; currency: string } | null;
}
interface Pkg {
  id: string;
  slug: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  active: boolean;
  sortOrder: number;
  _count: { bookings: number };
}
interface Rule {
  weekday: number;
  startMinute: number;
  endMinute: number;
}
interface Blocked {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}
interface Settings {
  timeZone: string;
  minNoticeHours: number;
  windowDays: number;
  bufferMinutes: number;
  slotStepMinutes: number;
  manualHoldHours: number;
  meetingUrl: string | null;
}

const STATUS_CHIP: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-green-500/15 text-green-400",
  RESCHEDULE_NEEDED: "bg-red-500/15 text-red-400",
  COMPLETED: "bg-navy-light text-text-secondary",
  CANCELLED: "bg-navy-light text-text-muted",
  EXPIRED: "bg-navy-light text-text-muted",
};

const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromHHMM = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};
/** datetime-local value (browser time) ⇄ ISO. */
const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const localInputToIso = (v: string) => new Date(v).toISOString();

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

const emptyPkg = {
  title: "",
  titleFr: "",
  description: "",
  descriptionFr: "",
  durationMinutes: 60,
  price: "0",
  currency: "USD",
  active: true,
  sortOrder: 0,
};

export default function AdminBookingsPage() {
  const [tab, setTab] = useState<"bookings" | "sessions" | "hours" | "timeoff">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "attention" | "past">("upcoming");

  const [pkgForm, setPkgForm] = useState<typeof emptyPkg & { id?: string }>(emptyPkg);
  const [pkgOpen, setPkgOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({ startsAt: "", endsAt: "", reason: "" });

  const load = useCallback(async () => {
    try {
      const d = await send("/api/admin/bookings", "GET");
      setBookings(d.bookings);
      setPackages(d.packages);
      setRules(d.rules.map((r: Rule) => ({ weekday: r.weekday, startMinute: r.startMinute, endMinute: r.endMinute })));
      setBlocked(d.blocked);
      setSettings(d.settings);
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount.
     
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setFlash(null);
    try {
      const r = (await fn()) as { warning?: string } | undefined;
      setFlash({ ok: !r?.warning, text: r?.warning || ok });
      await load();
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message });
    }
  };

  const tz = settings?.timeZone || "UTC";
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

   
  const now = Date.now();
  const shown = bookings.filter((b) => {
    const live = b.status !== "CANCELLED" && b.status !== "EXPIRED";
    if (filter === "attention") return b.status === "RESCHEDULE_NEEDED" || (b.status === "PENDING_PAYMENT" && b.order?.status === "PENDING");
    if (filter === "past") return new Date(b.endsAt).getTime() < now || !live;
    return new Date(b.endsAt).getTime() >= now && live;
  });

  const savePkg = () =>
    act(async () => {
      const body = {
        title: pkgForm.title,
        titleFr: pkgForm.titleFr,
        description: pkgForm.description,
        descriptionFr: pkgForm.descriptionFr,
        durationMinutes: Number(pkgForm.durationMinutes),
        priceCents: majorToMinor(Number(pkgForm.price || 0), pkgForm.currency),
        currency: pkgForm.currency,
        active: pkgForm.active,
        sortOrder: Number(pkgForm.sortOrder) || 0,
      };
      const r = pkgForm.id
        ? await send(`/api/admin/bookings/packages/${pkgForm.id}`, "PATCH", body)
        : await send("/api/admin/bookings/packages", "POST", body);
      setPkgOpen(false);
      return r;
    }, "Session saved.");

  const saveHours = () =>
    act(
      () =>
        send("/api/admin/bookings/availability", "PUT", {
          rules,
          settings: { ...settings, meetingUrl: settings?.meetingUrl || "" },
        }),
      "Hours and settings saved."
    );

  if (loading) return <p className="text-text-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-gold" /> Bookings
        </h1>
        <a href="/en/book" target="_blank" className="text-sm text-gold inline-flex items-center gap-1">
          Public booking page <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {packages.length === 0 || rules.length === 0 ? (
        <div className="glass p-4 text-sm text-amber-400">
          Clients can&apos;t book yet: {packages.length === 0 ? "add at least one session" : ""}
          {packages.length === 0 && rules.length === 0 ? " and " : ""}
          {rules.length === 0 ? "set your weekly hours" : ""}.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["bookings", "Bookings"],
            ["sessions", "Sessions"],
            ["hours", "Weekly hours"],
            ["timeoff", "Time off"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-md text-sm border ${tab === id ? "border-gold bg-gold/10" : "border-glass-border text-text-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {flash && (
        <p className={`text-sm rounded-md p-3 border ${flash.ok ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
          {flash.text}
        </p>
      )}

      {tab === "bookings" && (
        <div className="space-y-4">
          <div className="flex gap-2 text-sm">
            {(["upcoming", "attention", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md ${filter === f ? "bg-navy-light text-text-primary" : "text-text-secondary"}`}
              >
                {f === "upcoming" ? "Upcoming" : f === "attention" ? "Needs attention" : "Past & cancelled"}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted">Times shown in {tz}.</p>
          {shown.length === 0 ? (
            <div className="glass p-8 text-center text-text-secondary text-sm">Nothing here.</div>
          ) : (
            shown.map((b) => <BookingRow key={b.id} b={b} fmt={fmt} act={act} />)
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setPkgForm(emptyPkg);
              setPkgOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> New session
          </button>
          {packages.map((p) => (
            <div key={p.id} className="glass p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {p.title} {!p.active && <span className="text-xs text-text-muted">(inactive)</span>}
                </p>
                <p className="text-sm text-text-secondary">
                  {p.durationMinutes} min · {p.priceCents === 0 ? "Free" : formatPrice(p.priceCents, p.currency)} ·{" "}
                  {p._count.bookings} booking(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPkgForm({
                      id: p.id,
                      title: p.title,
                      titleFr: p.titleFr || "",
                      description: p.description,
                      descriptionFr: p.descriptionFr || "",
                      durationMinutes: p.durationMinutes,
                      price: String(minorToMajor(p.priceCents, p.currency)),
                      currency: p.currency,
                      active: p.active,
                      sortOrder: p.sortOrder,
                    });
                    setPkgOpen(true);
                  }}
                  className="px-3 py-1.5 text-sm rounded-md border border-glass-border"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${p.title}"?`)) act(() => send(`/api/admin/bookings/packages/${p.id}`, "DELETE"), "Session deleted.");
                  }}
                  className="px-3 py-1.5 text-sm rounded-md border border-glass-border text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {pkgOpen && (
            <div className="glass-strong p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-text-secondary">
                  Title (EN)
                  <input className={INPUT} value={pkgForm.title} onChange={(e) => setPkgForm({ ...pkgForm, title: e.target.value })} />
                </label>
                <label className="text-xs text-text-secondary">
                  Title (FR)
                  <input className={INPUT} value={pkgForm.titleFr} onChange={(e) => setPkgForm({ ...pkgForm, titleFr: e.target.value })} />
                </label>
                <label className="text-xs text-text-secondary sm:col-span-2">
                  Description (EN)
                  <textarea rows={3} className={INPUT} value={pkgForm.description} onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })} />
                </label>
                <label className="text-xs text-text-secondary sm:col-span-2">
                  Description (FR)
                  <textarea rows={3} className={INPUT} value={pkgForm.descriptionFr} onChange={(e) => setPkgForm({ ...pkgForm, descriptionFr: e.target.value })} />
                </label>
                <label className="text-xs text-text-secondary">
                  Duration (minutes)
                  <input type="number" min={15} max={480} step={15} className={INPUT} value={pkgForm.durationMinutes} onChange={(e) => setPkgForm({ ...pkgForm, durationMinutes: Number(e.target.value) })} />
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <label className="text-xs text-text-secondary">
                    Price (0 = free)
                    <input type="number" min={0} step="0.01" className={INPUT} value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })} />
                  </label>
                  <label className="text-xs text-text-secondary">
                    Currency
                    <select className={INPUT} value={pkgForm.currency} onChange={(e) => setPkgForm({ ...pkgForm, currency: e.target.value })}>
                      {SUPPORTED_CURRENCY_CODES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="text-xs text-text-secondary">
                  Order on page
                  <input type="number" min={0} className={INPUT} value={pkgForm.sortOrder} onChange={(e) => setPkgForm({ ...pkgForm, sortOrder: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-2 text-sm mt-5">
                  <input type="checkbox" checked={pkgForm.active} onChange={(e) => setPkgForm({ ...pkgForm, active: e.target.checked })} />
                  Open for booking
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={savePkg} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => setPkgOpen(false)} className="px-4 py-2 rounded-md border border-glass-border text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "hours" && settings && (
        <div className="space-y-4">
          <div className="glass p-5 space-y-4">
            <p className="text-sm text-text-secondary">
              Windows in which sessions may <em>start and end</em>, in your time zone. Add several per day for a break.
            </p>
            {WEEKDAYS.map((name, wd) => {
              const dayRules = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === wd);
              return (
                <div key={wd} className="grid sm:grid-cols-[8rem_1fr] gap-2 items-start border-t border-glass-border pt-3">
                  <p className="text-sm font-medium pt-2">{name}</p>
                  <div className="space-y-2">
                    {dayRules.length === 0 && <p className="text-sm text-text-muted pt-2">Unavailable</p>}
                    {dayRules.map(({ r, i }) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="time" className={`${INPUT} w-32`} value={toHHMM(r.startMinute)} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, startMinute: fromHHMM(e.target.value) } : x)))} />
                        <span className="text-text-muted">–</span>
                        <input type="time" className={`${INPUT} w-32`} value={toHHMM(r.endMinute === 1440 ? 1439 : r.endMinute)} onChange={(e) => setRules(rules.map((x, j) => (j === i ? { ...x, endMinute: fromHHMM(e.target.value) } : x)))} />
                        <button onClick={() => setRules(rules.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400" aria-label="Remove window">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => setRules([...rules, { weekday: wd, startMinute: 540, endMinute: 1020 }])} className="text-xs text-gold inline-flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add window
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass p-5 grid sm:grid-cols-2 gap-4">
            <label className="text-xs text-text-secondary">
              Your time zone (IANA, e.g. Africa/Cairo)
              <input className={INPUT} value={settings.timeZone} onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Default meeting link (https, private — sent only to confirmed clients)
              <input className={INPUT} value={settings.meetingUrl || ""} placeholder="https://meet.google.com/…" onChange={(e) => setSettings({ ...settings, meetingUrl: e.target.value })} />
            </label>
            {(
              [
                ["minNoticeHours", "Minimum notice (hours)"],
                ["windowDays", "Bookable up to (days ahead)"],
                ["bufferMinutes", "Buffer between sessions (minutes)"],
                ["slotStepMinutes", "Start times every (minutes)"],
                ["manualHoldHours", "Hold for mobile-money payments (hours)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="text-xs text-text-secondary">
                {label}
                <input type="number" min={0} className={INPUT} value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} />
              </label>
            ))}
          </div>
          <button onClick={saveHours} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm">
            <Save className="w-4 h-4" /> Save hours & settings
          </button>
        </div>
      )}

      {tab === "timeoff" && (
        <div className="space-y-3">
          <div className="glass p-5 grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
            <label className="text-xs text-text-secondary">
              From (your browser&apos;s time)
              <input type="datetime-local" className={INPUT} value={newBlock.startsAt} onChange={(e) => setNewBlock({ ...newBlock, startsAt: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              To
              <input type="datetime-local" className={INPUT} value={newBlock.endsAt} onChange={(e) => setNewBlock({ ...newBlock, endsAt: e.target.value })} />
            </label>
            <label className="text-xs text-text-secondary">
              Reason (private)
              <input className={INPUT} value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} />
            </label>
            <button
              disabled={!newBlock.startsAt || !newBlock.endsAt}
              onClick={() =>
                act(async () => {
                  const r = await send("/api/admin/bookings/blocked", "POST", {
                    startsAt: localInputToIso(newBlock.startsAt),
                    endsAt: localInputToIso(newBlock.endsAt),
                    reason: newBlock.reason,
                  });
                  setNewBlock({ startsAt: "", endsAt: "", reason: "" });
                  return r;
                }, "Time off added.")
              }
              className="px-4 py-2 rounded-md bg-gold text-charcoal font-semibold text-sm disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {blocked.map((b) => (
            <div key={b.id} className="glass p-3 flex items-center justify-between gap-3 text-sm">
              <span>
                {fmt(b.startsAt)} → {fmt(b.endsAt)}
                {b.reason && <span className="text-text-muted"> · {b.reason}</span>}
              </span>
              <button onClick={() => act(() => send(`/api/admin/bookings/blocked/${b.id}`, "DELETE"), "Removed.")} className="text-text-muted hover:text-red-400" aria-label="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({
  b,
  fmt,
  act,
}: {
  b: Booking;
  fmt: (iso: string) => string;
  act: (fn: () => Promise<unknown>, ok: string) => Promise<void>;
}) {
  const [link, setLink] = useState(b.meetingUrl || "");
  const [moveTo, setMoveTo] = useState("");
  const [open, setOpen] = useState(false);
  const paid = !b.order || b.order.status === "PAID";

  return (
    <div className="glass p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {fmt(b.startsAt)} · {b.package.title}
          </p>
          <p className="text-sm text-text-secondary">
            {b.name} · <a href={`mailto:${b.email}`} className="text-gold">{b.email}</a>
            {b.company && ` · ${b.company}`}
          </p>
          {b.order && (
            <p className="text-xs text-text-muted mt-1">
              Order {b.order.orderNumber} · {formatPrice(b.order.totalCents, b.order.currency)} · {b.order.paymentMethod} ·{" "}
              <span className={b.order.status === "PAID" ? "text-green-400" : "text-amber-400"}>{b.order.status}</span>
              {b.order.status === "PENDING" && (
                <>
                  {" "}— <Link href="/admin/store/orders" className="text-gold">confirm payment in Orders</Link>
                </>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_CHIP[b.status] ?? ""}`}>{b.status.replace("_", " ").toLowerCase()}</span>
          <button onClick={() => setOpen(!open)} className="text-sm px-3 py-1.5 rounded-md border border-glass-border">
            {open ? "Close" : "Manage"}
          </button>
        </div>
      </div>
      {b.notes && <p className="text-sm text-text-secondary mt-3 whitespace-pre-line border-l-2 border-glass-border pl-3">{b.notes}</p>}
      {open && (
        <div className="mt-4 pt-4 border-t border-glass-border grid gap-3">
          <div className="flex gap-2 items-end">
            <label className="flex-1 text-xs text-text-secondary">
              Meeting link for this booking
              <input className={INPUT} value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} />
            </label>
            <button onClick={() => act(() => send(`/api/admin/bookings/${b.id}`, "PATCH", { meetingUrl: link }), "Link saved.")} className="px-3 py-2 rounded-md border border-glass-border text-sm inline-flex items-center gap-1">
              <Video className="w-4 h-4" /> Save
            </button>
          </div>
          <div className="flex gap-2 items-end">
            <label className="flex-1 text-xs text-text-secondary">
              Move to (your browser&apos;s time) — re-sends the invite
              <input type="datetime-local" className={INPUT} value={moveTo || isoToLocalInput(b.startsAt)} onChange={(e) => setMoveTo(e.target.value)} />
            </label>
            <button disabled={!moveTo || !paid} onClick={() => act(() => send(`/api/admin/bookings/${b.id}`, "PATCH", { startsAt: localInputToIso(moveTo) }), "Booking moved and client notified.")} className="px-3 py-2 rounded-md border border-glass-border text-sm disabled:opacity-40">
              Move
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {b.status !== "COMPLETED" && paid && (
              <button onClick={() => act(() => send(`/api/admin/bookings/${b.id}`, "PATCH", { status: "COMPLETED" }), "Marked completed.")} className="px-3 py-1.5 rounded-md border border-glass-border text-sm inline-flex items-center gap-1">
                <Check className="w-4 h-4" /> Mark completed
              </button>
            )}
            {b.status !== "CANCELLED" && (
              <button
                onClick={() => {
                  if (confirm("Cancel this booking? Refund any payment separately in PayPal / mobile money."))
                    act(() => send(`/api/admin/bookings/${b.id}`, "PATCH", { status: "CANCELLED" }), "Booking cancelled.");
                }}
                className="px-3 py-1.5 rounded-md border border-glass-border text-sm text-red-400"
              >
                Cancel booking
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
