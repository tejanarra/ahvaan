import { notFound } from "next/navigation";
import { requireHost } from "@/lib/supabase/auth-server";
import { getEventFull } from "@/lib/data/events";
import { listInvites } from "@/lib/data/invites";
import { listRsvps } from "@/lib/data/rsvps";
import { GuestDashboard } from "@/components/guest-dashboard/guest-dashboard";
import { ShareInviteButton } from "@/components/guest-dashboard/share-invite-button";
import type { PendingInvite, RespondedGuest } from "@/components/guest-dashboard/guest-card";
import { resolveFormSchema, findFieldByRole, getFieldValue } from "@/lib/schemas/form-schema";
import type { Responses } from "@/lib/schemas/form-schema";

export const dynamic = "force-dynamic";

export default async function EventGuestsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const host = await requireHost();

  const event = await getEventFull(host.id, eventId);
  if (!event) {
    notFound();
  }

  const [invites, rsvps] = await Promise.all([
    listInvites(host.id, eventId),
    listRsvps(host.id, eventId),
  ]);

  const schema = resolveFormSchema(event.form_schema);
  const nameField = findFieldByRole(schema, "name");
  const attendingField = findFieldByRole(schema, "attending");
  const plusOnesField = findFieldByRole(schema, "plus_ones");

  const rsvpByInvite = new Map(rsvps.filter((r) => r.invite_id).map((r) => [r.invite_id, r]));

  const pendingInvites: PendingInvite[] = invites
    .filter((inv) => !rsvpByInvite.has(inv.id))
    .map((inv) => ({ id: inv.id, name: inv.name, email: inv.email, createdAt: inv.created_at }));

  const respondedGuests: RespondedGuest[] = rsvps.map((r) => {
    const responses: Responses = {};
    for (const field of schema.fields) {
      const value = getFieldValue(r, field);
      if (value !== undefined) responses[field.id] = value;
    }
    const nameValue = nameField ? responses[nameField.id] : undefined;
    const attendingValue = attendingField ? responses[attendingField.id] : undefined;
    const plusOnesValue = plusOnesField ? responses[plusOnesField.id] : undefined;

    return {
      id: r.id,
      inviteId: r.invite_id,
      name: (typeof nameValue === "string" && nameValue) || r.name,
      attending: attendingField ? attendingValue === "yes" : null,
      additionalGuests: Array.isArray(plusOnesValue) ? plusOnesValue : [],
      responses,
      createdAt: r.created_at,
    };
  });

  const attendingCount = attendingField
    ? respondedGuests.filter((g) => g.attending === true).length
    : null;
  const declinedCount = attendingField
    ? respondedGuests.filter((g) => g.attending === false).length
    : null;
  const totalGuests = plusOnesField
    ? respondedGuests.reduce((sum, g) => sum + 1 + g.additionalGuests.length, 0)
    : null;

  const stats = {
    sent: invites.length,
    pending: pendingInvites.length,
    responded: respondedGuests.length,
    attending: attendingCount,
    declined: declinedCount,
    totalGuests,
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Guests</h2>
        <ShareInviteButton eventId={event.id} eventSlug={event.slug} eventTitle={event.title} />
      </div>

      <div className="mt-4">
        <GuestDashboard
          eventId={event.id}
          eventSlug={event.slug}
          eventTitle={event.title}
          schema={schema}
          pendingInvites={pendingInvites}
          respondedGuests={respondedGuests}
          stats={stats}
        />
      </div>
    </div>
  );
}
