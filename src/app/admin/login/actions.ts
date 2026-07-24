"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, createAdminSessionToken, timingSafeEqual } from "@/lib/session";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

// In-memory only — resets on redeploy/restart, and won't be shared across
// multiple server instances. For a single-admin, low-traffic site this is
// still a meaningful deterrent against casual brute-forcing without needing
// a persistent store.
let failedAttempts = 0;
let windowStartedAt = 0;

function isLockedOut() {
  const now = Date.now();
  if (now - windowStartedAt > WINDOW_MS) {
    failedAttempts = 0;
    windowStartedAt = now;
    return false;
  }
  return failedAttempts >= MAX_ATTEMPTS;
}

function recordFailedAttempt() {
  const now = Date.now();
  if (now - windowStartedAt > WINDOW_MS) {
    windowStartedAt = now;
    failedAttempts = 0;
  }
  failedAttempts += 1;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (isLockedOut()) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const password = String(formData.get("password") ?? "");

  if (!process.env.ADMIN_PASSWORD) {
    return { status: "error", message: "Admin login is not configured." };
  }

  if (!(await timingSafeEqual(password, process.env.ADMIN_PASSWORD))) {
    recordFailedAttempt();
    return { status: "error", message: "Incorrect password." };
  }

  failedAttempts = 0;

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
