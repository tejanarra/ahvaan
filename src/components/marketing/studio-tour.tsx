"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  SearchIcon,
  MailIcon,
  DragHandleIcon,
  ImagesIcon,
  CodeBracketsIcon,
  CalendarIcon,
  ExternalLinkIcon,
} from "@/components/icons";

// A miniature, static replica of the *actual* Studio chrome — same
// breadcrumb/title/badge header as event-layout-shell.tsx, the same
// borderless SideNav row treatment (no icons — the real sidebar has none),
// and real ui/ components (StatTile, Badge, ToggleGroup, Button) — not a
// generic look-alike dashboard. No host data, no live queries; same "prove
// it with real components" spirit as the hero's ThemeDemo. Row height is
// fixed (H-9 + gap-1 = 40px) so the sliding active-row indicator's
// translateY math below stays in sync with the layout.
const ROW_HEIGHT = 40;

const TABS = [
  { id: "guests", label: "Guests" },
  { id: "invite", label: "Invite page" },
  { id: "forms", label: "Forms" },
  { id: "settings", label: "Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function GuestsPane() {
  const guests = [
    { name: "Amara Osei", status: "Attending" as const },
    { name: "Priya Nair", status: "Pending" as const },
    { name: "Diego Torres", status: "Attending" as const },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Attending" value={42} active className="pointer-events-none" />
        <StatTile label="Declined" value={6} className="pointer-events-none" />
        <StatTile label="Pending" value={9} className="pointer-events-none" />
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <SearchIcon className="h-3.5 w-3.5 text-muted" />
        <span className="text-xs text-muted">Search guests…</span>
      </div>
      <div className="space-y-1.5">
        {guests.map((g) => (
          <div
            key={g.name}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 transition-colors duration-150 hover:bg-surface-hover"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                {g.name.split(" ").map((p) => p[0]).join("")}
              </span>
              <p className="text-sm font-medium text-foreground">{g.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={g.status === "Attending" ? "success" : "neutral"}>{g.status}</Badge>
              <MailIcon className="h-3.5 w-3.5 text-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvitePane() {
  const blocks = ["Hero", "Countdown", "RSVP form", "Venue map"];
  const [device, setDevice] = useState("desktop");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Components</span>
        <ToggleGroup
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "mobile", label: "Mobile" },
          ]}
          value={device}
          onChange={setDevice}
          size="sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[104px_1fr]">
        <div className="hidden flex-col gap-1.5 rounded-md border border-border bg-surface-sunken/60 p-2 sm:flex">
          {["Hero", "Text", "Image", "Countdown"].map((c) => (
            <span
              key={c}
              className="rounded border border-border bg-surface px-2 py-1 text-center text-[10px] font-medium text-muted"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="space-y-1.5">
          {blocks.map((b, i) => (
            <div
              key={b}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-150",
                i === 2
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface text-foreground hover:bg-surface-hover"
              )}
            >
              <DragHandleIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
              {b}
              {i === 2 && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
                  Selected
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
          >
            + Add block
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface-sunken/60 px-3 py-2 text-[11px] text-muted">
        <CodeBracketsIcon className="h-3 w-3 shrink-0" /> Custom code available on any block or the whole page
      </div>
    </div>
  );
}

function FormsPane() {
  const forms = [
    { name: "RSVP", fields: ["Attending?", "Meal choice", "Song request"], count: 57 },
    { name: "Registry poll", fields: ["Favorite gift", "Notes"], count: 23 },
  ];
  return (
    <div className="space-y-2.5">
      {forms.map((f) => (
        <div
          key={f.name}
          className="rounded-md border border-border bg-surface p-3 transition-colors duration-150 hover:bg-surface-hover"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{f.name}</p>
            <Badge variant="accent">{f.count} submissions</Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {f.fields.map((field) => (
              <span
                key={field}
                className="rounded-full border border-border bg-surface-sunken px-2 py-0.5 text-[11px] text-muted"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition-colors duration-150 hover:border-accent hover:text-accent"
      >
        + New form
      </button>
    </div>
  );
}

function SettingsPane() {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Status</span>
        <div className="mt-1.5">
          <ToggleGroup
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ]}
            value="published"
            onChange={() => {}}
          />
        </div>
      </div>
      {(
        [
          { Icon: CalendarIcon, label: "RSVP deadline", value: "June 5, 2026" },
          { Icon: ImagesIcon, label: "Export guest list", value: null },
          { Icon: CodeBracketsIcon, label: "Custom page code", value: "Sandboxed" },
        ] as const
      ).map(({ Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 transition-colors duration-150 hover:bg-surface-hover"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Icon className="h-3.5 w-3.5 text-muted" /> {label}
          </span>
          {value ? (
            <span className="text-xs text-muted">{value}</span>
          ) : (
            <Button size="sm" variant="secondary" className="pointer-events-none h-7 px-2.5 text-xs">
              Download CSV
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

const PANES: Record<TabId, () => React.ReactElement> = {
  guests: GuestsPane,
  invite: InvitePane,
  forms: FormsPane,
  settings: SettingsPane,
};

const PANE_TITLES: Record<TabId, string> = {
  guests: "Guests",
  invite: "Invite page",
  forms: "Forms",
  settings: "Settings",
};

export function StudioTour() {
  const [tab, setTab] = useState<TabId>("guests");
  const activeIndex = TABS.findIndex((t) => t.id === tab);
  const Pane = PANES[tab];

  return (
    // Uses the shared --shadow-modal token (was a hand-copied 0.12-opacity
    // shadow that had already drifted from theme-demo.tsx's identical
    // 0.16-opacity "floating device frame" shadow — docs-audit H2, exactly
    // the drift a shared token exists to prevent).
    <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[var(--shadow-modal)]">
      {/* Zone A replica — event-layout-shell.tsx's breadcrumb/title/badge row */}
      <div className="border-b border-border px-4 pb-3 pt-4 sm:px-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">← Events</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="font-display text-lg text-foreground sm:text-xl">Maya &amp; Julien</p>
            <Badge variant="success">Published</Badge>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-xs text-muted sm:flex">
            View public page
            <ExternalLinkIcon className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[124px_1fr] sm:grid-cols-[168px_1fr]">
        {/* Zone B replica — SideNav's exact row treatment, sliding active indicator */}
        <nav aria-label="Preview dashboard section" className="relative flex flex-col gap-1 border-r border-border p-3">
          <div
            className="absolute inset-x-3 top-3 h-9 rounded-[var(--radius-sm)] bg-accent-soft shadow-[inset_2px_0_0_0_var(--color-accent)] transition-transform duration-200"
            style={{
              transform: `translateY(${activeIndex * ROW_HEIGHT}px)`,
              transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
            }}
            aria-hidden="true"
          />
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className={cn(
                  "relative z-10 flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-left text-[13px] transition-colors duration-150",
                  active ? "font-semibold text-accent" : "text-muted hover:text-foreground"
                )}
              >
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone C replica — PageHeader title + pane content, crossfades on tab switch */}
        <div className="min-h-[300px] p-4 sm:p-5">
          <p key={`title-${tab}`} className="animate-tour-pane-in text-sm font-semibold text-foreground">
            {PANE_TITLES[tab]}
          </p>
          <div key={tab} className="animate-tour-pane-in mt-3">
            <Pane />
          </div>
        </div>
      </div>
    </div>
  );
}
