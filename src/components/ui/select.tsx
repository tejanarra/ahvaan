import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-9 w-full appearance-none rounded-md border bg-background px-3 pr-8 text-sm text-foreground",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30",
          invalid ? "border-destructive focus:border-destructive" : "border-border focus:border-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});
