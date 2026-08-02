import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        // See input.tsx's matching comment — 16px below `sm` avoids iOS
        // Safari's auto-zoom-on-focus for small font sizes.
        "w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm text-foreground placeholder:text-muted-foreground",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30",
        invalid ? "border-destructive focus:border-destructive" : "border-border focus:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
