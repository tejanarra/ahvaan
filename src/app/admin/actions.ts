"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE } from "@/lib/session";
import { createServiceRoleClient } from "@/lib/supabase/server";

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
