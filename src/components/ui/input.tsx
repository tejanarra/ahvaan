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
        "h-9 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30",
        invalid ? "border-destructive focus:border-destructive" : "border-border focus:border-accent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
