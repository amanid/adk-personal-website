/**
 * Consulting bookings: availability, slot generation and reservation.
 *
 * Availability is weekly wall-clock windows in the consultant's time zone
 * (AvailabilityRule), minus time off (BlockedPeriod) and existing bookings.
 * A slot is reserved by inserting a Booking inside a transaction that holds a
 * Postgres advisory lock, so two clients can never take overlapping times —
 * whatever the package durations.
 */
import type { Prisma, BookingStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { secureToken } from "./store";
import { addCalendarDays, isValidTimeZone, zonedParts, zonedTimeToUtc } from "./timezone";

export interface BookingSettings {
  timeZone: string;
  minNoticeHours: number;
  windowDays: number;
  bufferMinutes: number;
  slotStepMinutes: number;
  /** How long an unpaid PayPal checkout holds its slot. */
  paypalHoldMinutes: number;
  /** How long a mobile-money booking holds its slot awaiting confirmation. */
  manualHoldHours: number;
}

export const BOOKING_SETTING_KEYS = {
  timeZone: "booking.timeZone",
  minNoticeHours: "booking.minNoticeHours",
  windowDays: "booking.windowDays",
  bufferMinutes: "booking.bufferMinutes",
  slotStepMinutes: "booking.slotStepMinutes",
  manualHoldHours: "booking.manualHoldHours",
  /** Private: never sent to the browser (see getSiteSettings). */
  meetingUrl: "private.booking.meetingUrl",
} as const;

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  timeZone: "Africa/Cairo",
  minNoticeHours: 24,
  windowDays: 30,
  bufferMinutes: 15,
  slotStepMinutes: 30,
  paypalHoldMinutes: 30,
  manualHoldHours: 48,
};

function intSetting(v: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
}

export async function getBookingSettings(): Promise<BookingSettings & { meetingUrl: string | null }> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(BOOKING_SETTING_KEYS) } },
  });
  const v = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const d = DEFAULT_BOOKING_SETTINGS;
  const tz = v[BOOKING_SETTING_KEYS.timeZone];
  return {
    timeZone: tz && isValidTimeZone(tz) ? tz : d.timeZone,
    minNoticeHours: intSetting(v[BOOKING_SETTING_KEYS.minNoticeHours], d.minNoticeHours, 0, 24 * 30),
    windowDays: intSetting(v[BOOKING_SETTING_KEYS.windowDays], d.windowDays, 1, 180),
    bufferMinutes: intSetting(v[BOOKING_SETTING_KEYS.bufferMinutes], d.bufferMinutes, 0, 240),
    slotStepMinutes: intSetting(v[BOOKING_SETTING_KEYS.slotStepMinutes], d.slotStepMinutes, 5, 240),
    paypalHoldMinutes: d.paypalHoldMinutes,
    manualHoldHours: intSetting(v[BOOKING_SETTING_KEYS.manualHoldHours], d.manualHoldHours, 1, 24 * 14),
    meetingUrl: v[BOOKING_SETTING_KEYS.meetingUrl] || null,
  };
}

/** Bookings that occupy their time: everything except released ones. */
const OCCUPYING: BookingStatus[] = ["CONFIRMED", "RESCHEDULE_NEEDED", "COMPLETED"];

function occupyingWhere(now: Date): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: OCCUPYING } },
      { status: "PENDING_PAYMENT", holdExpiresAt: { gt: now } },
    ],
  };
}

interface Interval {
  start: number;
  end: number;
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/**
 * Free start times for a package between `from` and `from + days`, as ISO
 * strings. Pure function of the inputs it is given, so it is used both to
 * show slots and to validate a requested one.
 */
export function generateSlots(opts: {
  durationMinutes: number;
  settings: BookingSettings;
  rules: { weekday: number; startMinute: number; endMinute: number }[];
  busy: Interval[];
  now: Date;
  /** First calendar day to consider, in the booking zone. */
  fromDay: [number, number, number];
  days: number;
}): string[] {
  const { durationMinutes, settings, rules, busy, now } = opts;
  const durMs = durationMinutes * 60_000;
  const bufMs = settings.bufferMinutes * 60_000;
  const earliest = now.getTime() + settings.minNoticeHours * 3_600_000;
  const latest = now.getTime() + settings.windowDays * 86_400_000;
  const out: string[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < opts.days; i++) {
    const [y, m, d] = addCalendarDays(...opts.fromDay, i);
    // Weekday of that calendar date (independent of zone).
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      for (let min = rule.startMinute; min + durationMinutes <= rule.endMinute; min += settings.slotStepMinutes) {
        const start = zonedTimeToUtc(y, m, d, Math.floor(min / 60), min % 60, settings.timeZone);
        if (!start) continue; // skipped by a DST change
        const s = start.getTime();
        if (s < earliest || s > latest || seen.has(s)) continue;
        // The buffer keeps a gap on both sides of every existing booking.
        const slot = { start: s - bufMs, end: s + durMs + bufMs };
        if (busy.some((b) => overlaps(slot, b))) continue;
        seen.add(s);
        out.push(start.toISOString());
      }
    }
  }
  return out.sort();
}

/** Everything that blocks time in [from, to): bookings and time off. */
async function loadBusy(db: Prisma.TransactionClient | typeof prisma, from: Date, to: Date, now: Date) {
  const [bookings, blocked] = await Promise.all([
    db.booking.findMany({
      where: { AND: [occupyingWhere(now), { startsAt: { lt: to }, endsAt: { gt: from } }] },
      select: { startsAt: true, endsAt: true },
    }),
    db.blockedPeriod.findMany({
      where: { startsAt: { lt: to }, endsAt: { gt: from } },
      select: { startsAt: true, endsAt: true },
    }),
  ]);
  return [...bookings, ...blocked].map((b) => ({ start: b.startsAt.getTime(), end: b.endsAt.getTime() }));
}

/** Available slots for a package over the booking window, from today. */
export async function availableSlots(packageId: string, now = new Date()): Promise<string[]> {
  const pkg = await prisma.servicePackage.findFirst({ where: { id: packageId, active: true } });
  if (!pkg) return [];
  const settings = await getBookingSettings();
  const rules = await prisma.availabilityRule.findMany();
  const today = zonedParts(now, settings.timeZone);
  const to = new Date(now.getTime() + (settings.windowDays + 2) * 86_400_000);
  const busy = await loadBusy(prisma, now, to, now);
  return generateSlots({
    durationMinutes: pkg.durationMinutes,
    settings,
    rules,
    busy,
    now,
    fromDay: [today.year, today.month, today.day],
    days: settings.windowDays + 1,
  });
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("That time is no longer available. Please choose another slot.");
    this.name = "SlotUnavailableError";
  }
}

// Arbitrary constant: one advisory lock serialises all reservations.
const BOOKING_LOCK_KEY = 7_400_221;

/**
 * Reserve a slot. Re-validates the requested start against the live
 * availability inside the lock, so a stale page or a crafted request can't
 * book outside working hours or over someone else.
 */
export async function reserveSlot(input: {
  packageId: string;
  startsAt: Date;
  name: string;
  email: string;
  company?: string | null;
  notes?: string | null;
  clientTimezone?: string | null;
  locale?: "en" | "fr";
  /** null = no hold (free bookings are confirmed immediately). */
  holdMinutes: number | null;
  status: BookingStatus;
  meetingUrl?: string | null;
}) {
  const settings = await getBookingSettings();
  const pkg = await prisma.servicePackage.findFirst({ where: { id: input.packageId, active: true } });
  if (!pkg) throw new SlotUnavailableError();
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY})`;

    // The same client retrying (e.g. cancelled PayPal, then mobile money)
    // must not be blocked by their own unpaid hold on this very slot.
    await tx.booking.updateMany({
      where: {
        status: "PENDING_PAYMENT",
        startsAt: input.startsAt,
        email: { equals: input.email, mode: "insensitive" },
        orderId: { not: null },
        order: { status: "PENDING" },
      },
      data: { status: "EXPIRED", holdExpiresAt: now },
    });

    const rules = await tx.availabilityRule.findMany();
    const startParts = zonedParts(input.startsAt, settings.timeZone);
    const end = new Date(input.startsAt.getTime() + pkg.durationMinutes * 60_000);
    const busy = await loadBusy(
      tx,
      new Date(input.startsAt.getTime() - 86_400_000),
      new Date(end.getTime() + 86_400_000),
      now
    );
    const valid = generateSlots({
      durationMinutes: pkg.durationMinutes,
      settings,
      rules,
      busy,
      now,
      fromDay: [startParts.year, startParts.month, startParts.day],
      days: 1,
    });
    if (!valid.includes(input.startsAt.toISOString())) throw new SlotUnavailableError();

    return tx.booking.create({
      data: {
        packageId: pkg.id,
        startsAt: input.startsAt,
        endsAt: end,
        status: input.status,
        holdExpiresAt: input.holdMinutes === null ? null : new Date(now.getTime() + input.holdMinutes * 60_000),
        name: input.name,
        email: input.email,
        company: input.company || null,
        notes: input.notes || null,
        clientTimezone: input.clientTimezone && isValidTimeZone(input.clientTimezone) ? input.clientTimezone : null,
        locale: input.locale === "fr" ? "fr" : "en",
        manageToken: secureToken(),
        meetingUrl: input.meetingUrl ?? null,
      },
      include: { package: true },
    });
  });
}

/**
 * Inside the payment transaction: confirm the booking an order paid for. If
 * its hold lapsed and someone else took the time meanwhile, it is flagged
 * RESCHEDULE_NEEDED instead of double-booking.
 */
export async function confirmBookingForOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const booking = await tx.booking.findUnique({ where: { orderId } });
  if (!booking || booking.status === "CONFIRMED" || booking.status === "COMPLETED") return;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOKING_LOCK_KEY})`;
  const now = new Date();
  const clash = await tx.booking.count({
    where: {
      id: { not: booking.id },
      AND: [occupyingWhere(now), { startsAt: { lt: booking.endsAt }, endsAt: { gt: booking.startsAt } }],
    },
  });
  const settings = await getBookingSettings();
  await tx.booking.update({
    where: { id: booking.id },
    data: {
      status: clash > 0 ? "RESCHEDULE_NEEDED" : "CONFIRMED",
      holdExpiresAt: null,
      meetingUrl: booking.meetingUrl ?? settings.meetingUrl,
    },
  });
}

/** When an unpaid booking order is cancelled or failed, free its slot. */
export async function releaseBookingForOrder(orderId: string): Promise<void> {
  await prisma.booking.updateMany({
    where: { orderId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELLED", cancelledAt: new Date(), holdExpiresAt: new Date() },
  });
}
