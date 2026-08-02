// Builds the magic link sent by deliverVerificationEmail — clicking it hits
// src/app/events/[slug]/verify/route.ts, which consumes the code and
// redirects back into the event page. Server-only (unlike
// buildInviteLink, which also runs client-side for share-link generation),
// so it always reads the site origin from the env rather than
// window.location.
function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

export function buildVerifyLink(eventSlug: string, subjectType: "rsvp" | "form", verificationId: string, code: string): string {
  const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
  const url = new URL(`/events/${eventSlug}/verify`, siteUrl);
  url.searchParams.set("vid", verificationId);
  url.searchParams.set("code", code);
  url.searchParams.set("type", subjectType);
  return url.toString();
}
