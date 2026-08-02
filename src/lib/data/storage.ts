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
