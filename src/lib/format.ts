// A DB `date` column comes back as "YYYY-MM-DD" — parsed with explicit UTC
// components (not `new Date(string)`) so the displayed date can't shift a
// day depending on the viewer's timezone.
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
