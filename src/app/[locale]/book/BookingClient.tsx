"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Clock, Check, Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import PaymentPanel, { postJson } from "@/components/payments/PaymentPanel";
import type { StartedCheckout } from "@/components/store/PayPalCheckout";

export interface PackageOption {
  slug: string;
  title: string;
  titleFr: string | null;
  description: string;
  descriptionFr: string | null;
  durationMinutes: number;
  priceCents: number;
  currency: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function StepHeader({ n, title, done, onChange }: { n: number; title: string; done?: string | null; onChange?: () => void }) {
  const t = useTranslations("booking");
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <h2 className="font-display text-2xl leading-tight flex items-baseline gap-3">
        <span className="font-mono tabular-nums text-sm text-gold">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {done && onChange && (
        <button
          type="button"
          onClick={onChange}
          className="min-h-11 px-3 -mr-3 text-sm text-gold hover:text-gold-light shrink-0 rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)]"
        >
          {t("change")}
        </button>
      )}
    </div>
  );
}

export default function BookingClient({ packages, preselect }: { packages: PackageOption[]; preselect: string | null }) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const fr = locale === "fr";
  const router = useRouter();

  const [pkgSlug, setPkgSlug] = useState<string | null>(
    preselect && packages.some((p) => p.slug === preselect) ? preselect : null
  );
  const pkg = packages.find((p) => p.slug === pkgSlug) ?? null;

  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [showAllDays, setShowAllDays] = useState(false);
  // Bumped to re-fetch slots, e.g. after the chosen one was taken.
  const [reload, setReload] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [detailsTouched, setDetailsTouched] = useState(false);
  const detailsValid = name.trim().length >= 2 && EMAIL_RE.test(email.trim());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const manageTokenRef = useRef<string | null>(null);

  // The visitor's own zone: every time on this page is shown in it.
  const [tz, setTz] = useState("UTC");
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    } catch {
      /* keep UTC */
    }
  }, []);

  useEffect(() => {
    if (!pkgSlug) return;
    let cancelled = false;
    setSlots(null);
    setSlotError(null);
    setDay(null);
    setStartsAt(null);
    fetch(`/api/bookings/slots?package=${encodeURIComponent(pkgSlug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { slots: string[] }) => !cancelled && setSlots(d.slots))
      .catch(() => !cancelled && setSlotError(t("error_generic")));
    return () => {
      cancelled = true;
    };
  }, [pkgSlug, reload, t]);

  const dayKey = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }),
    [tz]
  );
  const dayLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: "short", day: "numeric", month: "short" }),
    [tz, locale]
  );
  const timeLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
    [tz, locale]
  );
  const fullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone: tz,
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }),
    [tz, locale]
  );

  // Slots grouped by the visitor's calendar day.
  const byDay = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots ?? []) {
      const k = dayKey.format(new Date(s));
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return [...m.entries()];
  }, [slots, dayKey]);
  const visibleDays = showAllDays ? byDay : byDay.slice(0, 10);
  const daySlots = byDay.find(([k]) => k === day)?.[1] ?? [];

  const bookingBody = (payment: "PAYPAL" | "MANUAL" | "FREE", extra: Record<string, unknown> = {}) => ({
    packageSlug: pkgSlug,
    startsAt,
    name: name.trim(),
    email: email.trim(),
    company: company.trim(),
    notes: notes.trim(),
    timezone: tz,
    locale: fr ? "fr" : "en",
    payment,
    ...extra,
  });

  /**
   * Any failure to book (typically: the slot was just taken) invalidates the
   * chosen time, so drop it, refresh the list and say why where the visitor
   * will pick again. Re-throws so the payment widgets stop too.
   */
  const bookingFailed = (e: unknown): never => {
    const message = e instanceof Error && e.message ? e.message : t("error_generic");
    setError(message);
    setStartsAt(null);
    setReload((n) => n + 1);
    throw e instanceof Error ? e : new Error(message);
  };

  const goToBooking = () => {
    if (manageTokenRef.current) router.push(`/book/manage/${manageTokenRef.current}`);
  };

  const confirmFree = async () => {
    setDetailsTouched(true);
    if (!detailsValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const d = await postJson<{ manageToken: string }>("/api/bookings", bookingBody("FREE"), t("error_generic"));
      manageTokenRef.current = d.manageToken;
      goToBooking();
    } catch (e) {
      try {
        bookingFailed(e);
      } catch {
        /* already reported */
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full min-h-11 px-4 py-2.5 rounded-[var(--radius-md)] bg-navy border border-glass-border text-text-primary text-sm " +
    "placeholder:text-text-muted focus:border-gold focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-secondary mb-1.5";
  const nameInvalid = detailsTouched && name.trim().length < 2;
  const emailInvalid = detailsTouched && !EMAIL_RE.test(email.trim());
  const errorBox = "text-sm text-danger bg-danger/10 border border-danger/30 rounded-[var(--radius-md)] p-3";

  if (packages.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20">
        <p className="eyebrow mb-4">{t("eyebrow")}</p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
        <p className="lede mb-8">{t("no_packages")}</p>
        <ButtonLink href="/contact" size="lg">
          {t("contact")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
      <p className="eyebrow mb-4">{t("eyebrow")}</p>
      <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-5">{t("title")}</h1>
      <p className="lede max-w-2xl mb-12">{t("subtitle")}</p>

      <div className="space-y-6">
        {/* 1 · Package */}
        <section className="card p-5 md:p-7">
          <StepHeader
            n={1}
            title={t("step_package")}
            done={pkg ? pkg.slug : null}
            onChange={() => setPkgSlug(null)}
          />
          {pkg ? (
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-medium">{fr && pkg.titleFr ? pkg.titleFr : pkg.title}</p>
              <p className="text-sm text-text-secondary">
                {t("minutes", { n: pkg.durationMinutes })} ·{" "}
                <span className="font-mono tabular-nums text-text-primary">
                  {pkg.priceCents === 0 ? t("free") : formatPrice(pkg.priceCents, pkg.currency)}
                </span>
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {packages.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setPkgSlug(p.slug)}
                  className="card card-interactive text-left p-5"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="font-display text-xl leading-tight">{fr && p.titleFr ? p.titleFr : p.title}</span>
                    <span className="font-mono tabular-nums text-gold shrink-0">
                      {p.priceCents === 0 ? t("free") : formatPrice(p.priceCents, p.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-3">
                    {fr && p.descriptionFr ? p.descriptionFr : p.description}
                  </p>
                  <p className="font-mono text-xs text-text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden />
                    {t("minutes", { n: p.durationMinutes })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2 · Time */}
        {pkg && (
          <section className="card p-5 md:p-7">
            <StepHeader
              n={2}
              title={t("step_time")}
              done={startsAt}
              onChange={() => setStartsAt(null)}
            />
            {error && !startsAt && (
              <p role="alert" className={cn(errorBox, "mb-4")}>
                {error}
              </p>
            )}
            {startsAt ? (
              <p className="font-medium">{fullLabel.format(new Date(startsAt))}</p>
            ) : slotError ? (
              <p role="alert" className="text-sm text-danger">
                {slotError}
              </p>
            ) : slots === null ? (
              <p role="status" className="text-sm text-text-secondary flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> {t("loading_slots")}
              </p>
            ) : slots.length === 0 ? (
              <div>
                <p className="text-sm text-text-secondary mb-4">{t("no_slots")}</p>
                <ButtonLink href="/contact" variant="secondary">
                  {t("contact")}
                </ButtonLink>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-muted mb-4">{t("tz_note", { tz })}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {visibleDays.map(([k, list]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDay(k)}
                      aria-pressed={day === k}
                      className={cn(
                        "min-h-11 px-3.5 rounded-[var(--radius-md)] border text-sm transition-colors",
                        day === k
                          ? "border-gold bg-gold/10 text-text-primary"
                          : "border-glass-border hover:border-text-muted hover:bg-[var(--hover-wash)] text-text-secondary"
                      )}
                    >
                      {dayLabel.format(new Date(list[0]))}
                    </button>
                  ))}
                  {!showAllDays && byDay.length > visibleDays.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllDays(true)}
                      className="min-h-11 px-3.5 text-sm text-gold rounded-[var(--radius-md)] hover:bg-[var(--hover-wash)]"
                    >
                      {t("more_dates")}
                    </button>
                  )}
                </div>
                {day && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {daySlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStartsAt(s);
                          setError(null);
                        }}
                        className="font-mono tabular-nums min-h-11 px-2 rounded-[var(--radius-md)] border border-glass-border hover:border-gold hover:bg-gold/10 text-sm transition-colors"
                      >
                        {timeLabel.format(new Date(s))}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* 3 · Details */}
        {pkg && startsAt && (
          <section className="card p-5 md:p-7">
            <StepHeader n={3} title={t("step_details")} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="book-name" className={labelClass}>
                  {t("name")} <span aria-hidden>*</span>
                </label>
                <input
                  id="book-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  aria-invalid={nameInvalid || undefined}
                  aria-describedby={nameInvalid ? "book-details-error" : undefined}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="book-email" className={labelClass}>
                  {t("email")} <span aria-hidden>*</span>
                </label>
                <input
                  id="book-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  aria-invalid={emailInvalid || undefined}
                  aria-describedby={emailInvalid ? "book-details-error" : undefined}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="book-company" className={labelClass}>
                  {t("company")}
                </label>
                <input
                  id="book-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="book-notes" className={labelClass}>
                  {t("notes")}
                </label>
                <textarea
                  id="book-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder={t("notes_placeholder")}
                  className={cn(inputClass, "resize-y")}
                />
              </div>
            </div>
            {detailsTouched && !detailsValid && (
              <p id="book-details-error" role="alert" className="text-sm text-danger mt-3">
                {t("details_invalid")}
              </p>
            )}
          </section>
        )}

        {/* 4 · Confirm / pay */}
        {pkg && startsAt && (
          <section className="space-y-4">
            <div className="card p-5 md:p-7">
              <StepHeader n={4} title={t("summary")} />
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-text-muted">{t("session")}</dt>
                <dd>{fr && pkg.titleFr ? pkg.titleFr : pkg.title}</dd>
                <dt className="text-text-muted">{t("when")}</dt>
                <dd>{fullLabel.format(new Date(startsAt))}</dd>
                <dt className="text-text-muted">{t("duration")}</dt>
                <dd>{t("minutes", { n: pkg.durationMinutes })}</dd>
                <dt className="text-text-muted">{t("price")}</dt>
                <dd className="font-mono tabular-nums font-semibold">
                  {pkg.priceCents === 0 ? t("free") : formatPrice(pkg.priceCents, pkg.currency)}
                </dd>
              </dl>
              {pkg.priceCents === 0 && (
                <Button type="button" size="lg" onClick={confirmFree} loading={submitting} className="mt-6">
                  {!submitting && <Check className="w-4 h-4" aria-hidden />}
                  {submitting ? t("confirming") : t("confirm_free")}
                </Button>
              )}
              {error && (
                <p role="alert" className={cn(errorBox, "mt-4")}>
                  {error}
                </p>
              )}
            </div>

            {pkg.priceCents > 0 && (
              <PaymentPanel
                title={t("pay_title")}
                amountCents={pkg.priceCents}
                currency={pkg.currency}
                validate={() => {
                  setDetailsTouched(true);
                  return detailsValid;
                }}
                startPayPal={async () => {
                  const d = await postJson<StartedCheckout & { manageToken: string }>(
                    "/api/bookings",
                    bookingBody("PAYPAL"),
                    t("error_generic")
                  ).catch(bookingFailed);
                  manageTokenRef.current = d.manageToken;
                  return d;
                }}
                submitManual={async (provider, reference) => {
                  const d = await postJson<{ receiptToken: string; manageToken: string }>(
                    "/api/bookings",
                    bookingBody("MANUAL", { provider, reference }),
                    t("error_generic")
                  ).catch(bookingFailed);
                  manageTokenRef.current = d.manageToken;
                  return d.receiptToken;
                }}
                onDone={goToBooking}
              />
            )}
          </section>
        )}
      </div>

      <p className="text-sm text-text-muted mt-10">{t("reschedule_help")}</p>
    </div>
  );
}
