"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE } from "@/lib/session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { MAX_NAME_LENGTH, MAX_GUESTS } from "@/lib/rsvp-limits";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function deleteRsvp(id: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("wedding_rsvps").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function createInvite(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Guest name is required.");
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invite.");
  }

  revalidatePath("/admin");
  return data.id as string;
}

export async function deleteInvite(id: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("invites").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function updateRsvp(
  rsvpId: string,
  payload: { name: string; attending: boolean; additionalGuests: string[] }
) {
  const name = payload.name.trim().slice(0, MAX_NAME_LENGTH);
  if (!name) {
    throw new Error("Name is required.");
  }

  const additionalGuests = payload.additionalGuests
    .map((value) => value.trim().slice(0, MAX_NAME_LENGTH))
    .filter((value) => value.length > 0)
    .slice(0, MAX_GUESTS);

  const supabase = createServiceRoleClient();

  // Editing an existing row by its own id — works whether or not the
  // invite behind it still exists (an orphaned RSVP has no invite_id).
  const { error } = await supabase
    .from("wedding_rsvps")
    .update({
      name,
      attending: payload.attending,
      additional_guests: payload.attending ? additionalGuests : [],
    })
    .eq("id", rsvpId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
