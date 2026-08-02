"use server";

import { requireHost } from "@/lib/supabase/auth-server";
import { readHostProfileFormInput } from "@/lib/schemas/host-profile";
import { updateHostProfileFields, setHostAvatarUrl } from "@/lib/data/host-profile";
import { uploadHostAvatar } from "@/lib/data/storage";

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

  const url = await uploadHostAvatar(host.id, file);
  await setHostAvatarUrl(host.id, url);
  return url;
}

export async function clearAvatar() {
  const host = await requireHost();
  await setHostAvatarUrl(host.id, null);
}
