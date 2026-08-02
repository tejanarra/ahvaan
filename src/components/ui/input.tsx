import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        // text-base (16px) below the `sm` breakpoint, text-sm (14px) at/above
        // it — iOS Safari auto-zooms the whole page on focusing any input
        // under 16px, which on a small screen reads as "the app zooms in
        // when I tap a field." 16px is also the browser's own zoom-trigger
        // floor, not an arbitrary choice, so this doesn't touch desktop's
        // visual density at all (docs/04's `text-body` stays 14px there).
        "h-9 w-full rounded-md border bg-background px-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30",
        invalid ? "border-destructive focus:border-destructive" : "border-border focus:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
