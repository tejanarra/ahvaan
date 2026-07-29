"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/lib/auth-actions";

const initialState: AuthState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-lavender px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-gold/30 bg-white/90 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <h1 className="text-center font-display text-xl uppercase tracking-[0.15em] text-gold-dark">
          Sign In
        </h1>

        <div className="mt-5">
          <label
            htmlFor="email"
            className="block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            className="mt-1.5 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 text-base text-foreground focus:border-gold-dark focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="password"
            className="block font-display text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full border-0 border-b border-gold/35 bg-transparent px-0.5 py-1.5 text-base text-foreground focus:border-gold-dark focus:outline-none"
          />
        </div>

        {state.status === "error" && (
          <p className="mt-3 text-sm font-medium text-red-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-gold-dark px-4 py-2.5 font-display text-sm uppercase tracking-widest text-white shadow-sm transition hover:bg-[#5c3a0c] disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-foreground/70">
          New here?{" "}
          <Link href="/signup" className="font-medium text-gold-dark hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
