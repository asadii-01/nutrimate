import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  /** Optional call-to-action rendered below the message. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Friendly empty-state placeholder for data-driven views with no content yet
 * (no logs, no search results, etc.). DESIGN.md: encouraging, never a dead end.
 */
export function EmptyState({ icon: Icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-sm rounded-lg bg-surface-container-lowest px-md py-xl text-center shadow-card",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/15 text-primary">
        <Icon size={30} />
      </span>
      <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
      <p className="max-w-sm text-body-md text-on-surface-variant">{message}</p>
      {action ? (
        <Button onClick={action.onClick} className="mt-base">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
