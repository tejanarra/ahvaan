export function buildInviteLink(eventSlug: string, inviteId: string, origin?: string) {
  // Defaulting a parameter straight to `window.location.origin` would throw
  // a raw ReferenceError if this were ever called outside the browser (this
  // module has no "use client" boundary of its own — every call site today
  // happens to be a client component, but nothing enforces that). Checking
  // explicitly lets us fail with a clear message instead.
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!base) {
    throw new Error("buildInviteLink requires an explicit origin outside the browser.");
  }

  const url = new URL(`/events/${eventSlug}`, base);
  url.searchParams.set("i", inviteId);
  return url.toString();
}

export function buildInviteMessage(eventTitle: string, link: string) {
  return `You're invited to ${eventTitle}! Please RSVP here: ${link}`;
}
