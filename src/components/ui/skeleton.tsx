import { cn } from "@/lib/cn";

// Shimmer block for loading.tsx skeletons (docs/04-design-system.md).
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-sunken", className)} />;
}
