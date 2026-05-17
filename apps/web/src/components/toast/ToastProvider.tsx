import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { ToastContext, type Toast, type ToastVariant } from "./ToastContext";

const AUTO_DISMISS_MS = 4000;

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-primary/30 bg-primary-container/60 text-on-surface",
  error: "border-error/30 bg-error-container text-on-error-container",
  info: "border-tertiary/30 bg-tertiary-container/60 text-on-surface",
};

const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={20} className="text-primary" />,
  error: <TriangleAlert size={20} className="text-error" />,
  info: <Info size={20} className="text-tertiary" />,
};

/**
 * Toast notifications. Provides `useToast().toast(message, variant)` and
 * renders a stacked, auto-dismissing notification region in a portal.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-sm p-sm sm:items-end"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex w-full max-w-sm animate-[toastIn_0.2s_ease-out] items-start gap-sm",
                "rounded-md border p-sm shadow-floating",
                VARIANT_STYLES[t.variant],
              )}
            >
              <span className="mt-[2px] shrink-0">{VARIANT_ICON[t.variant]}</span>
              <p className="flex-1 text-body-md">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-base opacity-70 transition-opacity hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
