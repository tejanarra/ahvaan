import { InviteBook } from "./invite-book";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  let inviteId: string | null = null;
  let guestName: string | null = null;
  let existingRsvp:
    | { name: string; attending: boolean; additionalGuests: string[] }
    | null = null;

  if (invite) {
    const supabase = createServiceRoleClient();
    // A malformed invite param (not a valid uuid) errors rather than
    // returning no rows — either way, fall back to the view-only experience.
    const { data } = await supabase
      .from("invites")
      .select("id, name")
      .eq("id", invite)
      .maybeSingle();

    if (data) {
      inviteId = data.id;
      guestName = data.name;

      const { data: rsvp } = await supabase
        .from("wedding_rsvps")
        .select("name, attending, additional_guests")
        .eq("invite_id", inviteId)
        .maybeSingle();

      if (rsvp) {
        existingRsvp = {
          name: rsvp.name,
          attending: rsvp.attending,
          additionalGuests: rsvp.additional_guests ?? [],
        };
      }
    }
  }

  return (
    <div
      className="min-h-dvh bg-[#f7ecf7] bg-cover bg-center"
      style={{ backgroundImage: "url(/4.png)" }}
    >
      <InviteBook
        inviteId={inviteId}
        guestName={guestName}
        existingRsvp={existingRsvp}
      />
    </div>
  );
}
