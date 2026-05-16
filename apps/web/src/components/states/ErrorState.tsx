import { TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";
import { ApiClientError } from "../../lib/api";
import { Button } from "../ui/Button";

export interface ErrorStateProps {
  /** The thrown error — an `ApiClientError` message is surfaced when present. */
  error?: unknown;
  /** Overrides the headline. */
  title?: string;
  /** Retry handler — typically a TanStack Query `refetch`. */
  onRetry?: () => void;
  className?: string;
}

/** Extracts a human-readable message from an unknown error value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/** Inline error panel with an optional retry button. */
export function ErrorState({ error, title = "Couldn't load this", onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-sm rounded-lg bg-surface-container-lowest px-md py-xl text-center shadow-card",
        className,
      )}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container text-error">
        <TriangleAlert size={28} />
      </span>
      <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
      <p className="max-w-sm text-body-md text-on-surface-variant">{errorMessage(error)}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry} className="mt-base">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
