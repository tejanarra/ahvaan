"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, CloseIcon } from "@/components/icons";

type Toast = { id: number; message: string; variant: "default" | "error" };
type ToastContextValue = { show: (message: string, variant?: Toast["variant"]) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: Toast["variant"] = "default") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Takes `dismiss` + the raw `id` rather than a pre-bound `() => dismiss(id)`
// closure — that inline arrow was a new function identity on every
// ToastProvider render (i.e. every time any toast was added or removed),
// which as an effect dependency below restarted every *other* already-
// mounted toast's 4s auto-dismiss timer each time. Both `dismiss` (stable,
// see its useCallback above) and `toast.id` (unchanged for an existing
// toast across re-renders) are stable, so the effect now only re-runs when
// this specific toast's own timer should start.
function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div
      // Errors get an assertive live region — the default "status"/polite
      // queue used for success confirmations can be missed entirely if the
      // user is already reading/typing something else when it appears.
      role={toast.variant === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-pop)] transition-[opacity,transform] duration-200",
        toast.variant === "error" && "border-destructive/30 text-destructive"
      )}
    >
      {toast.variant === "error" ? <CloseIcon className="h-4 w-4 shrink-0" /> : <CheckIcon className="h-4 w-4 shrink-0 text-accent" />}
      <span className="flex-1">{toast.message}</span>
    </div>
  );
}

// Every dashboard mutation's transient "Saved"/"Sent"/error confirmation
// should route through this, replacing ad-hoc inline state (docs/04).
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
