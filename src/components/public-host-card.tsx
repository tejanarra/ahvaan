import type { HostProfilePublic } from "@/lib/data/host-profile";

// Rendered discreetly at the bottom of a guest's event page, above the
// "Made with ahvaan" link (docs/01 "Host profile", added 2026-08-02 —
// user-directed, see SAAS_PLAN.md's dated entry). The disclaimer always
// renders once an event is published, even if the host never set up a
// profile — a guest page always collects data on behalf of its host, not
// ahvaan, regardless of whether that host chose to put a name/photo to it.
export function PublicHostCard({ profile }: { profile: HostProfilePublic | null }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-2 pt-6 text-center">
      {profile && (profile.display_name || profile.bio || profile.avatar_url) && (
        <div className="mb-3 flex flex-col items-center gap-2">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-12 w-12 rounded-full border border-[var(--t-fg)]/15 object-cover"
            />
          )}
          {profile.display_name && (
            <p className="text-sm font-medium text-[var(--t-fg)]/80">
              Hosted by {profile.display_name}
            </p>
          )}
          {profile.bio && (
            <p className="max-w-sm text-xs leading-relaxed text-[var(--t-fg)]/60">{profile.bio}</p>
          )}
        </div>
      )}
      <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-[var(--t-fg)]/45">
        This event page and any information collected here are created and managed solely by
        its host, not ahvaan. ahvaan provides the platform only and is not responsible for the
        content, data requests, or use of any information submitted on this page.
      </p>
    </div>
  );
}
