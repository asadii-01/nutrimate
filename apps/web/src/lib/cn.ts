/**
 * Tiny className joiner — drops falsy values and joins with a space.
 * Kept dependency-free; for the component set in this app it is enough.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
