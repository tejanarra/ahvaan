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
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50",
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
