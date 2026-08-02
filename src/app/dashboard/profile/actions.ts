"use server";

import { requireHost, createAuthServerClient } from "@/lib/supabase/auth-server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { readHostProfileFormInput } from "@/lib/schemas/host-profile";
import { getHostProfile, updateHostProfileFields, setHostAvatarUrl } from "@/lib/data/host-profile";
import { uploadHostAvatar, deleteHostAvatarByUrl, deleteAllHostImages } from "@/lib/data/storage";
import { listEvents } from "@/lib/data/events";

export async function updateHostProfile(formData: FormData) {
  const host = await requireHost();

  const parsed = readHostProfileFormInput(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid profile input.");
  }

  await updateHostProfileFields(host.id, parsed.data);
}

export async function uploadAvatar(formData: FormData) {
  const host = await requireHost();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No image file provided.");
  }

  const previous = await getHostProfile(host.id);

  const url = await uploadHostAvatar(host.id, file);
  await setHostAvatarUrl(host.id, url);

  // Delete the old photo only after the new one is safely uploaded and
  // saved — never the other way round, so a failed upload never leaves a
  // host with no photo at all.
  if (previous?.avatar_url) {
    await deleteHostAvatarByUrl(previous.avatar_url);
  }

  return url;
}

export async function clearAvatar() {
  const host = await requireHost();

  const previous = await getHostProfile(host.id);
  await setHostAvatarUrl(host.id, null);

  if (previous?.avatar_url) {
    await deleteHostAvatarByUrl(previous.avatar_url);
  }
}

// Full account deletion. auth.users rows are `on delete cascade`d into
// from every host-scoped table (events, invites, rsvps, email_sends,
// custom_components, forms, form_submissions, host_profiles) — deleting
// the auth user wipes all of that data automatically. Storage objects
// aren't covered by any DB cascade (they live in a separate system), so
// every event's images and the host's avatar are wiped explicitly first,
// while eventIds are still known — deliberately no redirect() here (see
// dashboard/actions.ts's deleteEvent comment on why a programmatically-
// invoked server action shouldn't redirect: the client's own try/catch
// would swallow the special redirect signal as a real error); the caller
// navigates itself once this resolves.
export async function deleteAccount() {
  const host = await requireHost();

  const events = await listEvents(host.id);
  await deleteAllHostImages(host.id, events.map((e) => e.id));

  const supabase = createServiceRoleClient();
  const { error } = await supabase.auth.admin.deleteUser(host.id);
  if (error) throw new Error(error.message);

  // Best-effort: the auth user is already gone, so any subsequent request
  // with the stale cookie will fail getUser() anyway and be treated as
  // signed out — this just clears the cookie proactively for this response.
  try {
    const authClient = await createAuthServerClient();
    await authClient.auth.signOut();
  } catch {
    // Ignore — see comment above.
  }
}
