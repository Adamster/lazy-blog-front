import { ResponseError } from "@/shared/api/openapi";

// Queue lives outside React so it can be pushed imperatively from non-component
// code; `<Toaster />` subscribes and renders.
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
        // keep the default message
      }
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  push({ tone: "error", title: "Error", description: message });
};
