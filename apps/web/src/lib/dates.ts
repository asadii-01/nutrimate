/**
 * Date helpers for the web app.
 *
 * The API stores per-day records at UTC midnight (see `apps/api/src/lib/dates.ts`),
 * so every "day" value the client sends or compares must be a UTC calendar date.
 * All helpers here therefore work off the UTC date, never the local one.
 */

/** Today as `YYYY-MM-DD` in UTC. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A UTC calendar date `n` days before today, as `YYYY-MM-DD`. */
export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of `YYYY-MM-DD` strings ending today, `days` long. */
export function isoRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => isoDaysAgo(days - 1 - i));
}

/** Short, human label for an ISO date — e.g. `Mon 12`. */
export function shortLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });
}

/** Friendly long date — e.g. `Friday, 16 May`. */
export function longLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
