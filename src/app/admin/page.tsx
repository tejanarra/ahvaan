import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { DeleteRsvpButton } from "./delete-rsvp-button";
import { ShareInviteButton } from "./share-invite-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServiceRoleClient();
  const { data: rsvps, error } = await supabase
    .from("wedding_rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  const attendingCount = rsvps?.filter((r) => r.attending).length ?? 0;
  const decliningCount = (rsvps?.length ?? 0) - attendingCount;
  const totalGuests =
    rsvps
      ?.filter((r) => r.attending)
      .reduce((sum, r) => sum + 1 + (r.additional_guests?.length ?? 0), 0) ?? 0;

  const stats = [
    { label: "Responses", value: rsvps?.length ?? 0 },
    { label: "Attending", value: attendingCount },
    { label: "Declined", value: decliningCount },
    { label: "Total guests", value: totalGuests },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">RSVP Guest List</h1>
          <div className="flex items-center gap-3">
            <ShareInviteButton />
            <LogoutButton />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
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

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Attending</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Plus ones</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rsvps?.map((rsvp) => (
                <tr key={rsvp.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{rsvp.name}</td>
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
                  <td className="px-4 py-3 text-gray-700">
                    {rsvp.additional_guests?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {rsvp.additional_guests.map((guest: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {guest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {new Date(rsvp.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteRsvpButton id={rsvp.id} name={rsvp.name} />
                  </td>
                </tr>
              ))}
              {rsvps?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No RSVPs yet.
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
