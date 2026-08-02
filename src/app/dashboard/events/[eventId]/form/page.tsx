import { redirect } from "next/navigation";

// The old standalone "RSVP form" tab moved to Guests → Fields (see
// ../fields/page.tsx and ../event-nav.ts) — this route stays as a
// redirect so any bookmark or stale link still lands somewhere real.
export default async function LegacyFormRedirect({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/dashboard/events/${eventId}/fields`);
}
