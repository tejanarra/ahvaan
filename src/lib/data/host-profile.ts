import { createServiceRoleClient } from "@/lib/supabase/server";
import type { HostProfileFormInput } from "@/lib/schemas/host-profile";
import { createKeyedCache } from "@/lib/cache/keyed-cache";

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

const COLUMNS = "host_id, display_name, bio, avatar_url, updated_at";
const PUBLIC_COLUMNS = "display_name, bio, avatar_url";

export async function getHostProfile(hostId: string): Promise<HostProfileRecord | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("host_profiles")
    .select(COLUMNS)
    .eq("host_id", hostId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Cached the same way as getEventBySlugPublic in events.ts — a guest page
// render shouldn't pay for a fresh query on every request just to show a
// name/bio/avatar. See src/lib/cache/keyed-cache.ts for why this isn't
// `unstable_cache` (its static `tags` option can't be templated per call,
// so a per-host revalidateTag never actually matched anything).
const hostProfilePublicCache = createKeyedCache(
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
  (hostId) => hostId
);

export async function getHostProfilePublic(hostId: string): Promise<HostProfilePublic | null> {
  return hostProfilePublicCache.get(hostId);
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

  hostProfilePublicCache.invalidate(hostId);
}

export async function setHostAvatarUrl(hostId: string, avatarUrl: string | null): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("host_profiles").upsert(
    { host_id: hostId, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
    { onConflict: "host_id" }
  );
  if (error) throw error;

  hostProfilePublicCache.invalidate(hostId);
}
