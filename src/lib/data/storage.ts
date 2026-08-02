import { createServiceRoleClient } from "@/lib/supabase/server";
import { DataError } from "@/lib/data/errors";

const BUCKET = "event-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedImageType(contentType: string): boolean {
  return contentType in ALLOWED_TYPES;
}

// Every uploaded object lives under its owning host's id (matches this
// project's host-scoping convention everywhere else) so a leaked/guessed
// path from one host's event never collides with, or could be confused
// for, another host's — even though the bucket itself is public-read.
export async function uploadEventImage(
  hostId: string,
  eventId: string,
  file: File
): Promise<string> {
  if (!isAllowedImageType(file.type)) {
    throw new DataError("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new DataError("Images must be 5MB or smaller.");
  }

  const ext = ALLOWED_TYPES[file.type];
  const path = `${hostId}/${eventId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new DataError(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Every image uploaded for an event (hero cover, any Image/carousel block)
// lives under this one `${hostId}/${eventId}/` folder regardless of which
// URL column/block referenced it — so wiping the event's whole folder
// covers all of them without having to parse page_schema for image URLs.
// Called when an event is deleted (events.ts's deleteEvent) so an
// event never leaves orphaned files behind in a public-read bucket.
export async function deleteEventImages(hostId: string, eventId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const prefix = `${hostId}/${eventId}`;
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(prefix);
  if (listError) throw new DataError(listError.message);
  if (!files || files.length === 0) return;

  const paths = files.map((f) => `${prefix}/${f.name}`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new DataError(error.message);
}

const AVATAR_BUCKET = "host-avatars";

// Same validation/path-scoping model as uploadEventImage above, just keyed
// by host id alone (a profile photo isn't tied to one event) and in its
// own bucket so a host's avatar and their events' images stay independent.
export async function uploadHostAvatar(hostId: string, file: File): Promise<string> {
  if (!isAllowedImageType(file.type)) {
    throw new DataError("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new DataError("Images must be 5MB or smaller.");
  }

  const ext = ALLOWED_TYPES[file.type];
  const path = `${hostId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new DataError(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Every getPublicUrl'd object's path can be recovered from its own URL —
// used to delete the *specific* old avatar file being replaced/cleared,
// without having to list the host's whole avatar folder for one file.
function storagePathFromPublicUrl(bucket: string, url: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

// Called before/after a host uploads a new avatar (replace) or clears
// theirs (remove) — otherwise every past photo just accumulates as an
// orphaned file in a public-read bucket forever.
export async function deleteHostAvatarByUrl(url: string): Promise<void> {
  const path = storagePathFromPublicUrl(AVATAR_BUCKET, url);
  if (!path) return;

  const supabase = createServiceRoleClient();
  await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}

// Full account deletion (see dashboard/profile actions.deleteAccount):
// wipes every file this host ever uploaded across both buckets. Event
// images are scoped to the host's own top-level folder (not per-event) so
// deleting every event's row via cascade doesn't leave any host's images
// behind — the caller still needs each eventId to scope the per-event
// `list()` calls (Storage's `list` isn't recursive across the eventId
// subfolders), so this takes them explicitly rather than trying to
// enumerate the host's whole prefix itself.
export async function deleteAllHostImages(hostId: string, eventIds: string[]): Promise<void> {
  const supabase = createServiceRoleClient();

  await Promise.all(eventIds.map((eventId) => deleteEventImages(hostId, eventId)));

  const { data: avatarFiles } = await supabase.storage.from(AVATAR_BUCKET).list(hostId);
  if (avatarFiles && avatarFiles.length > 0) {
    await supabase.storage.from(AVATAR_BUCKET).remove(avatarFiles.map((f) => `${hostId}/${f.name}`));
  }
}
