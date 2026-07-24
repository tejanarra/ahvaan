"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-center text-xl font-semibold text-gray-900">
          Admin Login
        </h1>
        <div className="mt-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-800">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        {state.status === "error" && (
          <p className="mt-3 text-sm font-medium text-red-600">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
