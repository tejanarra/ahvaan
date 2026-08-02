import type { ReactNode } from "react";

// The one shell every group of controls in the Properties Panel renders
// through — a plain title + optional hint + content, separated by a hairline
// divider instead of a nested bordered box. Used for both "page settings"
// (theme colors, page CSS, custom page) and a selected block's own controls
// (layout, move-to, its type-specific fields), so the panel reads as one
// consistent rhythm instead of a stack of unrelated boxed widgets.
export function PanelSection({
  title,
  hint,
  actions,
  children,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5 border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted">{title}</h3>
        {actions}
      </div>
      {hint && <p className="-mt-1 text-xs text-muted">{hint}</p>}
      {children}
    </section>
  );
}
