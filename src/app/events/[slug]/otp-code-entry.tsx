"use client";

import { useState } from "react";

const inputClass =
  "mt-0 w-full rounded-md border border-[var(--t-accent)]/30 bg-transparent px-3 py-2 text-sm text-[var(--t-fg)] placeholder:text-[var(--t-fg)]/45 focus:border-[var(--t-accent-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--t-accent)]/20";

// A bare 6-digit-code input — shared by the page-level verification gate
// (email-verification-modal.tsx). Leads with "click the
// link we sent" (clicking it finishes verification directly — the
// relevant BroadcastChannel listener auto-updates this exact tab once
// that happens, no refresh needed) with the manual code as the fallback
// for email clients that strip links or a guest checking mail on a
// different device.
export function OtpCodeEntry({
  email,
  pending,
  error,
  onVerify,
  onCancel,
}: {
  email: string;
  pending: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  return (
    <div className="space-y-2 rounded-md border border-[var(--t-accent)]/30 p-3">
      <p className="text-sm text-[var(--t-fg)]/80">
        We sent a link to <span className="font-medium">{email}</span> — click it to finish (this page updates
        automatically). Or enter the code from that email below.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6-digit code"
          className={inputClass + " min-w-0 flex-1"}
        />
        <button
          type="button"
          onClick={() => onVerify(code)}
          disabled={pending || code.length === 0}
          className="shrink-0 rounded-md border border-[var(--t-accent)]/30 px-3 py-2 text-sm text-[var(--t-accent-dark)] transition hover:border-[var(--t-accent-dark)] disabled:opacity-50"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="button" onClick={onCancel} className="text-xs text-[var(--t-fg)]/60 underline underline-offset-2">
        Use a different email
      </button>
    </div>
  );
}
