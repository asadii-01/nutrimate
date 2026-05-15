import { createContext } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  /** Queue a toast. Returns its id. */
  toast: (message: string, variant?: ToastVariant) => number;
  /** Dismiss a toast early. */
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
