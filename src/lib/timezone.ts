/**
 * Time-zone arithmetic on the built-in Intl API (no dependency).
 *
 * Availability is defined as wall-clock hours in the consultant's zone, which
 * may observe daylight saving time, so converting "Tuesday 09:00 there" to an
 * instant has to use that zone's offset on that particular date.
 */

export interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock reading of `date` in `timeZone`. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of formatter(timeZone).formatToParts(date)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds (east positive). */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  // Drop seconds/ms so the difference is the pure offset.
  const whole = Math.floor(date.getTime() / 60000) * 60000;
  return asUtc - whole;
}

/**
 * The instant at which the wall clock in `timeZone` reads the given time, or
 * null when that reading never happens (the hour skipped at a DST change).
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date | null {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes: the offset at the first guess can differ from the offset at
  // the answer when a DST transition falls between them.
  let t = naive - offsetMs(new Date(naive), timeZone);
  t = naive - offsetMs(new Date(t), timeZone);
  const check = zonedParts(new Date(t), timeZone);
  if (check.year !== year || check.month !== month || check.day !== day || check.hour !== hour || check.minute !== minute) {
    return null;
  }
  return new Date(t);
}

/** Calendar date (y/m/d) `days` after the given one, ignoring time zones. */
export function addCalendarDays(y: number, m: number, d: number, days: number): [number, number, number] {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}
