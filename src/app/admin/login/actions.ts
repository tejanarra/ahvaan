"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, createAdminSessionToken } from "@/lib/session";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD) {
    return { status: "error", message: "Admin login is not configured." };
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return { status: "error", message: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}
