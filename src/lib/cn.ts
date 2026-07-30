// Minimal classnames combiner — no external dependency. Accepts strings,
// falsy values (skipped), and arrays of the same, so callers can write
// `cn("base", condition && "variant", className)` freely.
type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
