import { unstable_cache, revalidateTag } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { HostProfileFormInput } from "@/lib/schemas/host-profile";

export type HostProfileRecord = {
  host_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at: string;
};

// The only shape a guest page ever sees — never host_id/updated_at.
export type HostProfilePublic = {
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const PUBLIC_COLUMNS = "display_name, bio, avatar_url";

export async function getHostProfile(hostId: string): Promise<HostProfileRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("host_profiles")
    .select("*")
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Cached the same way as getEventBySlugPublic in events.ts — a guest page
// render shouldn't pay for a fresh query on every request just to show a
// name/bio/avatar. unstable_cache's static `tags` option can't be
// templated per-call, so invalidation goes through revalidateTag at each
// write's call site instead (see below); the cache key still varies per
// host via the `hostId` keyPart.
const getHostProfilePublicCached = unstable_cache(
  async (hostId: string): Promise<HostProfilePublic | null> => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("host_profiles")
      .select(PUBLIC_COLUMNS)
      .eq("host_id", hostId)
      .maybeSingle();

    if (error) throw error;
    // No row, or a host who cleared every field — either way, nothing to
    // show (see PublicHostCard's own "all fields blank" check too).
    if (!data || (!data.display_name && !data.bio && !data.avatar_url)) return null;
    return data;
  },
  ["host-profile-public"],
  { tags: [] }
);

export async function getHostProfilePublic(hostId: string): Promise<HostProfilePublic | null> {
  return getHostProfilePublicCached(hostId);
}

// Two independent partial-update paths (name/bio vs. avatar) rather than
// one upsert taking both — the avatar upload/clear flow doesn't carry the
// name/bio form fields with it, and upserting with those blanked out would
// wipe whatever the host had already saved.
export async function updateHostProfileFields(
  hostId: string,
  input: HostProfileFormInput
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("host_profiles").upsert(
    {
      host_id: hostId,
      display_name: input.displayName || null,
      bio: input.bio || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "host_id" }
  );
  if (error) throw error;

  revalidateTag(`host-profile:${hostId}`, "max");
}

export async function setHostAvatarUrl(hostId: string, avatarUrl: string | null): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("host_profiles").upsert(
    { host_id: hostId, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
    { onConflict: "host_id" }
  );
  if (error) throw error;

  revalidateTag(`host-profile:${hostId}`, "max");
}
