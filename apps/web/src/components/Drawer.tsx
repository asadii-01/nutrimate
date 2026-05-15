import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Edge the panel slides from. Mobile always feels best from the bottom. */
  side?: "right" | "bottom";
  children: React.ReactNode;
}

/**
 * Slide-in overlay panel — used for nutrition detail, serving selectors, etc.
 * Closes on backdrop click and Escape; locks body scroll while open.
 */
export function Drawer({ open, onClose, title, side = "right", children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-on-surface/40 backdrop-blur-[1px]"
      />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 flex flex-col bg-surface-container-lowest shadow-floating",
          side === "right"
            ? "ml-auto h-full w-full max-w-md animate-[slideInRight_0.2s_ease-out] rounded-l-xl"
            : "mt-auto max-h-[85vh] w-full animate-[slideInUp_0.2s_ease-out] rounded-t-xl",
        )}
      >
        <header className="flex items-center justify-between border-b border-outline-variant px-md py-sm">
          <h2 className="text-headline-md text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-base text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-md">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
