import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "destructive" | "accent";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-surface text-muted border-border",
  success: "bg-success/10 text-success border-success/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  accent: "bg-accent/10 text-accent border-accent/20",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
