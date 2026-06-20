import { ResponseError } from "@/shared/api/openapi";

/**
 * Module-level toast emitter. `addToastSuccess`/`addToastError` are called
 * imperatively from hooks and other non-component code, so the toast queue
 * lives outside React: a tiny subscribe/emit store that the `<Toaster />`
 * provider subscribes to and renders. Keeps the exact public signatures the
 * app already depends on.
 */

export type ToastTone = "success" | "error";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description: string;
}

type Listener = (toasts: readonly Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<Listener>();

const emit = () => {
  const snapshot = toasts;
  listeners.forEach((listener) => listener(snapshot));
};

export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToasts = (): readonly Toast[] => toasts;

const push = (toast: Omit<Toast, "id">) => {
  toasts = [...toasts, { ...toast, id: nextId++ }];
  emit();
};

export const dismissToast = (id: number) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
};

export const addToastSuccess = (message: string) => {
  push({ tone: "success", title: "Success", description: message });
};

export const addToastError = async (message: string, error?: unknown) => {
  if (error instanceof ResponseError) {
    if (error.response.status === 404) {
      message = "Not Found.";
    } else {
      try {
        const errorBody = await error.response.json();
        message = errorBody.detail || errorBody.message || message;
      } catch {
        // ignore parse error, keep default message
      }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  push({ tone: "error", title: "Error", description: message });
};
