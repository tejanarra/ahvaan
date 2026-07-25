export function buildInviteLink(inviteId: string, origin = window.location.origin) {
  const url = new URL(origin);
  url.searchParams.set("invite", inviteId);
  return url.toString();
}

export function buildInviteMessage(link: string) {
  return `You're invited to Swathi & Sai Teja's wedding! Please RSVP here: ${link}`;
}
