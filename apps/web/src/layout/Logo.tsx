import { Leaf } from "lucide-react";
import { cn } from "../lib/cn";

/** NutriMate wordmark with the leaf glyph. */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-sm", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary">
        <Leaf size={20} />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block text-headline-md text-primary">NutriMate</span>
          <span className="block text-caption text-on-surface-variant">Guided Vitality</span>
        </span>
      ) : null}
    </div>
  );
}
