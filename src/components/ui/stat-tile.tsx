import { cn } from "@/lib/cn";

export interface StatTileProps {
  label: string;
  value: number | string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StatTile({ label, value, active, onClick, className }: StatTileProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors",
        onClick && "cursor-pointer hover:bg-surface",
        active ? "border-foreground bg-surface" : "border-border bg-background",
        className
      )}
    >
      <p
        className="text-xl tabular-nums text-foreground"
        style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
      >
        {value}
      </p>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
    </Component>
  );
}
