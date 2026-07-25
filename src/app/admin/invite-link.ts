export function buildInviteLink(inviteId: string, origin?: string) {
  // Defaulting a parameter straight to `window.location.origin` would throw
  // a raw ReferenceError if this were ever called outside the browser (this
  // module has no "use client" boundary of its own — every call site today
  // happens to be a client component, but nothing enforces that). Checking
  // explicitly lets us fail with a clear message instead.
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!base) {
    throw new Error("buildInviteLink requires an explicit origin outside the browser.");
  }

  const url = new URL(base);
  url.searchParams.set("invite", inviteId);
  return url.toString();
}

export function buildInviteMessage(link: string) {
  return `You're invited to Swathi & Sai Teja's wedding! Please RSVP here: ${link}`;
}
