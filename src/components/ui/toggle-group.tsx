import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToggleGroupOption {
  value: string;
  label: ReactNode;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  /** A single selected value, or an array for multi-select callers. */
  value: string | string[];
  /**
   * Called with the clicked option's value. For multi-select, the caller
   * owns the toggle-inclusion logic (this component only reports clicks).
   */
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 px-2 text-xs",
  md: "h-8 px-3 text-sm",
};

export function ToggleGroup({ options, value, onChange, size = "sm", className, ...rest }: ToggleGroupProps) {
  const isSelected = (optionValue: string) => (Array.isArray(value) ? value.includes(optionValue) : value === optionValue);

  return (
    <div className={cn("inline-flex overflow-hidden rounded-md border border-border", className)} role="group" {...rest}>
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={isSelected(option.value)}
          className={cn(
            "font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
            SIZE_CLASSES[size],
            i > 0 && "border-l border-border",
            isSelected(option.value) ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-surface"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
