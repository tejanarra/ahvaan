import type { HostProfilePublic } from "@/lib/data/host-profile";

// Rendered discreetly at the bottom of a guest's event page, above the
// "Made with ahvaan" link (docs/01 "Host profile", added 2026-08-02 —
// user-directed, see SAAS_PLAN.md's dated entry). The disclaimer always
// renders once an event is published, even if the host never set up a
// profile — a guest page always collects data on behalf of its host, not
// ahvaan, regardless of whether that host chose to put a name/photo to it.
// Deliberately tiny/low-contrast (name + avatar only, no bio) — this is a
// legal footnote, not a profile card; it should read as background text a
// guest can ignore, not a second thing competing with the event itself.
export function PublicHostCard({ profile }: { profile: HostProfilePublic | null }) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-1 px-4 pb-4 pt-3 text-center">
      {profile && (profile.display_name || profile.avatar_url) && (
        <div className="flex items-center gap-1.5">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-5 w-5 rounded-full object-cover opacity-90"
            />
          )}
          {profile.display_name && (
            <span className="text-[11px] font-medium text-[var(--t-fg)]/55">
              Hosted by {profile.display_name}
            </span>
          )}
        </div>
      )}
      <p className="max-w-[22rem] text-[10px] leading-snug text-[var(--t-fg)]/35">
        This page and any data collected here are managed by its host, not ahvaan.
      </p>
    </div>
  );
}
