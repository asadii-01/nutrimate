import { cn } from "../../lib/cn";

/** Pulsing placeholder block used while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-container-high", className)} />;
}

/** A card-shaped skeleton — the default loading shape for dashboard tiles. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-sm rounded-lg bg-surface-container-lowest p-md shadow-card", className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/** A responsive grid of skeleton cards. */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
