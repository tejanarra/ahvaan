import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border px-6 py-14 text-center", className)}>
      {/* docs/04: EmptyState title is "Fraunces title" (text-title), not a
          raw Tailwind size (docs-audit H2). */}
      <p className="text-title text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
