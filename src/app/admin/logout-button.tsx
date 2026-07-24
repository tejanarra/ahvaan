"use client";

import { logout } from "./actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-gold/40 px-3 py-1.5 font-display text-xs uppercase tracking-wider text-gold-dark transition hover:border-gold-dark"
      >
        Log out
      </button>
    </form>
  );
}
