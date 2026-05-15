/** Date helpers — all log/prediction dates are normalized to UTC midnight. */

/** Midnight (UTC) of the given date, or of today when omitted. */
export function startOfUtcDay(date: Date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** `YYYY-MM-DD` string for the given date (UTC). */
export function toIsoDate(date: Date = new Date()): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` string into a UTC-midnight Date. */
export function fromIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Date `months` months before the given reference (used by the rollup job). */
export function monthsAgo(months: number, from: Date = new Date()): Date {
  const d = startOfUtcDay(from);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}
