import { createServiceRoleClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServiceRoleClient();
  const { data: rsvps, error } = await supabase
    .from("wedding_rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  const attendingCount =
    rsvps?.filter((r) => r.attending).length ?? 0;
  const totalGuests =
    rsvps
      ?.filter((r) => r.attending)
      .reduce((sum, r) => sum + 1 + (r.additional_guests?.length ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">RSVP Guest List</h1>
          <LogoutButton />
        </div>

        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <span>{rsvps?.length ?? 0} responses</span>
          <span>&middot;</span>
          <span>{attendingCount} attending</span>
          <span>&middot;</span>
          <span>{totalGuests} total guests</span>
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
                <th className="px-4 py-3 text-left font-medium text-gray-700">Guests</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
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
                    {rsvp.additional_guests?.length
                      ? rsvp.additional_guests.join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {new Date(rsvp.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {rsvps?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
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
