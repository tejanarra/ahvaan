"use client";

import { useMemo, useState, useTransition } from "react";
import { SearchIcon, MailIcon } from "@/components/icons";
import { PendingGuestCard, RespondedGuestCard } from "./guest-card";
import type { PendingInvite, RespondedGuest } from "./guest-card";
import { sendReminderEmails } from "@/app/dashboard/events/[eventId]/actions";
import type { FormSchema } from "@/lib/schemas/form-schema";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

type Tab = "invites" | "responded";
type RespondedFilter = "all" | "attending" | "declined";
type SortBy = "date-desc" | "date-asc" | "name-asc" | "name-desc";

type Stats = {
  sent: number;
  pending: number;
  responded: number;
  // null = this event's form has no "attending"/"plus-ones"-role field, so
  // there's nothing to compute — hide the corresponding tiles/filters
  // instead of showing a meaningless 0.
  attending: number | null;
  declined: number | null;
  totalGuests: number | null;
};

function matchesSearch(query: string, name: string, extraNames: string[] = []) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // Match against name + plus-ones combined, case-insensitive, any part of
  // any word — and require every word typed to appear somewhere, so a
  // multi-word search ("reddy rakshith") still matches regardless of order.
  const haystack = [name, ...extraNames].join(" ").toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((word) => haystack.includes(word));
}

function sortByOption<T extends { name: string; createdAt: string }>(
  items: T[],
  sortBy: SortBy
): T[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "date-desc":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  return sorted;
}

export function GuestDashboard({
  eventId,
  eventSlug,
  eventTitle,
  schema,
  pendingInvites,
  respondedGuests,
  stats,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  schema: FormSchema;
  pendingInvites: PendingInvite[];
  respondedGuests: RespondedGuest[];
  stats: Stats;
}) {
  const eventContext = { eventId, eventSlug, eventTitle, schema };
  const hasAttendingData = stats.attending !== null;
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("invites");
  const [respondedFilter, setRespondedFilter] = useState<RespondedFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [isSendingReminders, startReminderTransition] = useTransition();

  const pendingWithEmail = pendingInvites.filter((inv) => inv.email);

  const handleSendReminders = () => {
    startReminderTransition(async () => {
      try {
        const { sent, total } = await sendReminderEmails(eventId);
        show(
          sent < total ? `Sent ${sent} of ${total} — some failed.` : `Sent ${sent} of ${total}.`,
          sent < total ? "error" : "default"
        );
      } catch (err) {
        show(err instanceof Error ? err.message : "Failed to send.", "error");
      }
    });
  };

  const filteredPending = useMemo(
    () =>
      sortByOption(
        pendingInvites.filter((inv) => matchesSearch(search, inv.name)),
        sortBy
      ),
    [pendingInvites, search, sortBy]
  );

  const filteredResponded = useMemo(
    () =>
      sortByOption(
        respondedGuests
          .filter((g) => {
            if (respondedFilter === "attending") return g.attending === true;
            if (respondedFilter === "declined") return g.attending === false;
            return true;
          })
          .filter((g) => matchesSearch(search, g.name, g.additionalGuests)),
        sortBy
      ),
    [respondedGuests, respondedFilter, search, sortBy]
  );

  const statTiles: { label: string; value: number; onClick?: () => void }[] = [
    { label: "Sent", value: stats.sent },
    { label: "Pending", value: stats.pending, onClick: () => setTab("invites") },
    {
      label: "Responded",
      value: stats.responded,
      onClick: () => {
        setTab("responded");
        setRespondedFilter("all");
      },
    },
    ...(stats.attending !== null
      ? [
          {
            label: "Attending",
            value: stats.attending,
            onClick: () => {
              setTab("responded");
              setRespondedFilter("attending");
            },
          },
        ]
      : []),
    ...(stats.declined !== null
      ? [
          {
            label: "Declined",
            value: stats.declined,
            onClick: () => {
              setTab("responded");
              setRespondedFilter("declined");
            },
          },
        ]
      : []),
    ...(stats.totalGuests !== null ? [{ label: "Guests", value: stats.totalGuests }] : []),
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {statTiles.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} onClick={stat.onClick} />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="sm:w-52">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="name-asc">Name (A–Z)</option>
          <option value="name-desc">Name (Z–A)</option>
        </Select>
      </div>

      <div className="mt-4 flex gap-2">
        <ToggleGroup
          size="md"
          className="flex-1"
          options={[
            { value: "invites", label: `Invites (${pendingInvites.length})` },
            { value: "responded", label: `Responded (${respondedGuests.length})` },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </div>

      {tab === "responded" && hasAttendingData && (
        <div className="mt-3">
          <ToggleGroup
            options={[
              { value: "all", label: "All" },
              { value: "attending", label: "Attending" },
              { value: "declined", label: "Not attending" },
            ]}
            value={respondedFilter}
            onChange={(v) => setRespondedFilter(v as RespondedFilter)}
          />
        </div>
      )}

      {tab === "invites" && pendingWithEmail.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleSendReminders} loading={isSendingReminders}>
            <MailIcon className="h-3.5 w-3.5" />
            {isSendingReminders ? "Sending..." : `Email all pending (${pendingWithEmail.length})`}
          </Button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tab === "invites" &&
          filteredPending.map((invite) => <PendingGuestCard key={invite.id} invite={invite} event={eventContext} />)}
        {tab === "responded" &&
          filteredResponded.map((guest) => <RespondedGuestCard key={guest.id} guest={guest} event={eventContext} />)}
      </div>

      {tab === "invites" && filteredPending.length === 0 && (
        <EmptyState
          className="mt-4"
          title={pendingInvites.length === 0 ? "No invites sent yet" : "No invites match your search"}
          description={
            pendingInvites.length === 0 ? 'Use "Share invite link" above to create one.' : undefined
          }
        />
      )}
      {tab === "responded" && filteredResponded.length === 0 && (
        <EmptyState
          className="mt-4"
          title={respondedGuests.length === 0 ? "No responses yet" : "No guests match this filter"}
        />
      )}
    </div>
  );
}
