import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { ShareInviteButton } from "./share-invite-button";
import { GuestDashboard } from "./guest-dashboard";
import type { PendingInvite, RespondedGuest } from "./guest-card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServiceRoleClient();
  const [{ data: rsvps, error }, { data: invites, error: invitesError }] =
    await Promise.all([
      supabase
        .from("wedding_rsvps")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const rsvpByInvite = new Map(
    (rsvps ?? []).filter((r) => r.invite_id).map((r) => [r.invite_id, r])
  );

  const pendingInvites: PendingInvite[] = (invites ?? [])
    .filter((inv) => !rsvpByInvite.has(inv.id))
    .map((inv) => ({ id: inv.id, name: inv.name, createdAt: inv.created_at }));

  const respondedGuests: RespondedGuest[] = (rsvps ?? []).map((r) => ({
    id: r.id,
    inviteId: r.invite_id,
    name: r.name,
    attending: r.attending,
    additionalGuests: r.additional_guests ?? [],
    createdAt: r.created_at,
  }));

  const attendingCount = respondedGuests.filter((g) => g.attending).length;
  const declinedCount = respondedGuests.length - attendingCount;
  const totalGuests = respondedGuests
    .filter((g) => g.attending)
    .reduce((sum, g) => sum + 1 + g.additionalGuests.length, 0);

  const stats = {
    sent: invites?.length ?? 0,
    pending: pendingInvites.length,
    responded: respondedGuests.length,
    attending: attendingCount,
    declined: declinedCount,
    totalGuests,
  };

  return (
    <div
      className="min-h-screen bg-[#f7ecf7] bg-cover bg-center px-3 py-8 sm:px-4 sm:py-10"
      style={{ backgroundImage: "url(/4.png)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-xl uppercase tracking-[0.1em] text-gold-dark sm:text-2xl">
            RSVP Guest List
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ShareInviteButton />
            <LogoutButton />
          </div>
        </div>

        {(error || invitesError) && (
          <p className="mt-6 text-sm font-medium text-red-600">
            Failed to load data: {error?.message ?? invitesError?.message}
          </p>
        )}

        <div className="mt-6">
          <GuestDashboard
            pendingInvites={pendingInvites}
            respondedGuests={respondedGuests}
            stats={stats}
          />
        </div>
      </div>
    </div>
  );
}
