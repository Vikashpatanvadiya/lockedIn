// All journal dates are plain "YYYY-MM-DD" strings, computed in UTC so a
// page's date never shifts with the viewer's timezone.

const DAY = 86_400_000;

export function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return fromUTC(toUTC(iso) + n * DAY);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

/** The viewer's local calendar date. Call on the client. */
export function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function clampDate(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });
const longFmt = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const shortFmt = fmt({ month: "short", day: "numeric", year: "numeric" });
const monthFmt = fmt({ month: "short" });
const weekdayFmt = fmt({ weekday: "long" });
const dayMonthFmt = fmt({ month: "long", day: "numeric" });

export const formatLong = (iso: string) => longFmt.format(toUTC(iso));
export const formatShort = (iso: string) => shortFmt.format(toUTC(iso));
export const formatMonth = (iso: string) => monthFmt.format(toUTC(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(toUTC(iso));
export const formatDayMonth = (iso: string) => dayMonthFmt.format(toUTC(iso));

export function weekdayIndex(iso: string): number {
  return new Date(toUTC(iso)).getUTCDay();
}

/** Next occurrence of a birthday strictly after `from`. */
export function nextBirthday(birthday: string, from: string): string {
  const [, m, d] = birthday.split("-");
  const year = Number(from.slice(0, 4));
  for (const y of [year, year + 1]) {
    const candidate = `${y}-${m}-${d}`;
    if (candidate > from) return candidate;
  }
  return `${year + 1}-${m}-${d}`;
}

/** Most recent birthday on or before `from` — the day the current year started. */
export function lastBirthday(birthday: string, from: string): string {
  const [, m, d] = birthday.split("-");
  const year = Number(from.slice(0, 4));
  const candidate = `${year}-${m}-${d}`;
  return candidate <= from ? candidate : `${year - 1}-${m}-${d}`;
}

/** Age the person turns on `on` (their birthday that day or the next). */
export function ageOn(birthday: string, on: string): number {
  const by = Number(birthday.slice(0, 4));
  const oy = Number(on.slice(0, 4));
  return on.slice(5) >= birthday.slice(5) ? oy - by : oy - by - 1;
}

// "23 Sept 2026" — the feed's own date style.
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

export function formatFeed(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${SHORT_MONTHS[Number(m) - 1]} ${y}`;
}
