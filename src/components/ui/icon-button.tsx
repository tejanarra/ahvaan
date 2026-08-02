import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type IconButtonVariant = "ghost" | "outline" | "destructive";

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost: "text-muted hover:bg-surface hover:text-foreground",
  outline: "border border-border text-foreground hover:bg-surface",
  destructive: "text-destructive hover:bg-destructive/10",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, variant = "ghost", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        // Mobile floor is the 40px touch target (docs/05); desktop keeps the
        // tighter 32px chrome — same pattern as ToggleGroup's mobile bump.
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50 sm:h-8 sm:w-8",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
