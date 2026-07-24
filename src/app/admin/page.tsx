import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { DeleteRsvpButton } from "./delete-rsvp-button";
import { DeleteInviteButton } from "./delete-invite-button";
import { CopyInviteLinkButton } from "./copy-invite-link-button";
import { ShareInviteButton } from "./share-invite-button";

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

  const attendingCount = rsvps?.filter((r) => r.attending).length ?? 0;
  const decliningCount = (rsvps?.length ?? 0) - attendingCount;
  const totalGuests =
    rsvps
      ?.filter((r) => r.attending)
      .reduce((sum, r) => sum + 1 + (r.additional_guests?.length ?? 0), 0) ?? 0;

  const respondedInviteIds = new Set(
    rsvps?.map((r) => r.invite_id).filter(Boolean) ?? []
  );

  const stats = [
    { label: "Responses", value: rsvps?.length ?? 0 },
    { label: "Attending", value: attendingCount },
    { label: "Declined", value: decliningCount },
    { label: "Total guests", value: totalGuests },
  ];

  return (
    <div
      className="min-h-screen bg-[#f7ecf7] bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url(/4.png)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl uppercase tracking-[0.1em] text-gold-dark">
            RSVP Guest List
          </h1>
          <div className="flex items-center gap-3">
            <ShareInviteButton />
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gold/25 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
            >
              <p className="font-display text-2xl text-gold-dark">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-sm font-medium text-red-600">
            Failed to load RSVPs: {error.message}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-gold/25 bg-white/80 shadow-sm backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gold/15 text-sm">
            <thead className="bg-lavender/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Attending</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Plus ones</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {rsvps?.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{rsvp.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        rsvp.attending
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
                      }
                    >
                      {rsvp.attending ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">
                    {rsvp.additional_guests?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {rsvp.additional_guests.map((guest: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-lavender/50 px-2 py-0.5 text-xs text-foreground/80"
                          >
                            {guest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/60">
                    {new Date(rsvp.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteRsvpButton id={rsvp.id} name={rsvp.name} />
                  </td>
                </tr>
              ))}
              {rsvps?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-foreground/50">
                    No RSVPs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-display text-lg uppercase tracking-[0.1em] text-gold-dark">
          Invites Sent
        </h2>
        <p className="mt-1 font-script text-base italic text-foreground/70">
          Only guests with one of these links can access the RSVP form.
        </p>

        {invitesError && (
          <p className="mt-4 text-sm font-medium text-red-600">
            Failed to load invites: {invitesError.message}
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-gold/25 bg-white/80 shadow-sm backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gold/15 text-sm">
            <thead className="bg-lavender/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gold-dark">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {invites?.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{invite.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        respondedInviteIds.has(invite.id)
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-lavender/50 px-2 py-0.5 text-xs font-medium text-foreground/70"
                      }
                    >
                      {respondedInviteIds.has(invite.id) ? "Responded" : "Waiting"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/60">
                    {new Date(invite.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <CopyInviteLinkButton id={invite.id} />
                      <DeleteInviteButton id={invite.id} name={invite.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {invites?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-foreground/50">
                    No invites sent yet. Use &ldquo;Share invite link&rdquo; above to
                    create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
