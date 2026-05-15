import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "./ToastContext";

/** Access the toast queue. Must be used within a `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
