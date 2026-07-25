"use client";

import { useMemo, useState } from "react";
import { SearchIcon, SortIcon, ChevronDownIcon } from "./icons";
import { PendingGuestCard, RespondedGuestCard } from "./guest-card";
import type { PendingInvite, RespondedGuest } from "./guest-card";

type Tab = "invites" | "responded";
type RespondedFilter = "all" | "attending" | "declined";
type SortBy = "date-desc" | "date-asc" | "name-asc" | "name-desc";

type Stats = {
  sent: number;
  pending: number;
  responded: number;
  attending: number;
  declined: number;
  totalGuests: number;
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
  pendingInvites,
  respondedGuests,
  stats,
}: {
  pendingInvites: PendingInvite[];
  respondedGuests: RespondedGuest[];
  stats: Stats;
}) {
  const [tab, setTab] = useState<Tab>("invites");
  const [respondedFilter, setRespondedFilter] = useState<RespondedFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");

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
            if (respondedFilter === "attending") return g.attending;
            if (respondedFilter === "declined") return !g.attending;
            return true;
          })
          .filter((g) => matchesSearch(search, g.name, g.additionalGuests)),
        sortBy
      ),
    [respondedGuests, respondedFilter, search, sortBy]
  );

  const statTiles: { label: string; value: number; onClick?: () => void }[] = [
    { label: "Sent", value: stats.sent },
    {
      label: "Pending",
      value: stats.pending,
      onClick: () => setTab("invites"),
    },
    {
      label: "Responded",
      value: stats.responded,
      onClick: () => {
        setTab("responded");
        setRespondedFilter("all");
      },
    },
    {
      label: "Attending",
      value: stats.attending,
      onClick: () => {
        setTab("responded");
        setRespondedFilter("attending");
      },
    },
    {
      label: "Declined",
      value: stats.declined,
      onClick: () => {
        setTab("responded");
        setRespondedFilter("declined");
      },
    },
    { label: "Guests", value: stats.totalGuests },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {statTiles.map((stat) =>
          stat.onClick ? (
            <button
              key={stat.label}
              type="button"
              onClick={stat.onClick}
              className="rounded-xl border border-gold/25 bg-white/80 px-3 py-3 text-left shadow-sm backdrop-blur-sm transition hover:border-gold/50 hover:bg-white"
            >
              <p className="font-display text-2xl text-gold-dark">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                {stat.label}
              </p>
            </button>
          ) : (
            <div
              key={stat.label}
              className="rounded-xl border border-gold/25 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-sm"
            >
              <p className="font-display text-2xl text-gold-dark">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                {stat.label}
              </p>
            </div>
          )
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="h-11 w-full rounded-full border border-gold/25 bg-white/90 pl-9 pr-3 text-base text-foreground shadow-sm transition focus:border-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <div className="relative sm:w-52">
          <SortIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/35" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-11 w-full appearance-none rounded-full border border-gold/25 bg-white/90 pl-9 pr-9 text-base text-foreground shadow-sm transition focus:border-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("invites")}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            tab === "invites"
              ? "border-gold-dark bg-gold-dark text-white"
              : "border-gold/25 bg-white/80 text-foreground/70 hover:border-gold/50"
          }`}
        >
          Invites ({pendingInvites.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("responded")}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            tab === "responded"
              ? "border-gold-dark bg-gold-dark text-white"
              : "border-gold/25 bg-white/80 text-foreground/70 hover:border-gold/50"
          }`}
        >
          Responded ({respondedGuests.length})
        </button>
      </div>

      {tab === "responded" && (
        <div className="mt-3 flex gap-1.5">
          {(["all", "attending", "declined"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRespondedFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                respondedFilter === value
                  ? "border-gold-dark bg-lavender/60 text-gold-dark"
                  : "border-gold/25 text-foreground/60 hover:border-gold/50"
              }`}
            >
              {value === "all" ? "All" : value === "attending" ? "Attending" : "Not attending"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tab === "invites" &&
          filteredPending.map((invite) => (
            <PendingGuestCard key={invite.id} invite={invite} />
          ))}
        {tab === "responded" &&
          filteredResponded.map((guest) => (
            <RespondedGuestCard key={guest.id} guest={guest} />
          ))}
      </div>

      {tab === "invites" && filteredPending.length === 0 && (
        <p className="mt-4 rounded-xl border border-gold/25 bg-white/80 px-4 py-8 text-center text-sm text-foreground/50 shadow-sm backdrop-blur-sm">
          {pendingInvites.length === 0
            ? 'No invites sent yet. Use "Share invite link" above to create one.'
            : "No invites match your search."}
        </p>
      )}
      {tab === "responded" && filteredResponded.length === 0 && (
        <p className="mt-4 rounded-xl border border-gold/25 bg-white/80 px-4 py-8 text-center text-sm text-foreground/50 shadow-sm backdrop-blur-sm">
          {respondedGuests.length === 0 ? "No responses yet." : "No guests match this filter."}
        </p>
      )}
    </div>
  );
}
