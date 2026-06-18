import { ResponseError } from "@/shared/api/openapi";
import { addToast } from "@heroui/react";

// Mono/brutalist toast skin. Toasts portal to <body> (outside `.mono-scope`,
// so the `--m-*` tokens don't resolve there) — use the dark mono palette
// literally; a dark toast reads fine over both light and dark pages.
// Square, 2px subtle frame + a 3px accent left edge (lime = success,
// red = error), matching the auth callout idiom.
const toastSkin = (edge: string, iconColor: string) => ({
  base: `rounded-none border-2 border-l-[3px] !border-[#2c2c2c] ${edge} !bg-[#1a1a1a] shadow-none`,
  title: "font-bold text-[13px] tracking-[0.01em] text-[#ededed]",
  description: "text-[12.5px] leading-[1.5] text-[#9a9a9a]",
  icon: iconColor,
  closeButton:
    "rounded-none text-[#6f6f6f] data-[hover=true]:bg-[#262626] data-[hover=true]:text-[#ededed]",
});

const successSkin = toastSkin("!border-l-[#cdff48]", "text-[#cdff48]");
const errorSkin = toastSkin("!border-l-[#ff6b6b]", "text-[#ff6b6b]");

export const addToastSuccess = (message: string) => {
  addToast({
    title: "Success",
    description: message,
    color: "success",
    variant: "flat",
    classNames: successSkin,
  });
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

  addToast({
    title: "Error",
    description: message,
    color: "danger",
    variant: "flat",
    classNames: errorSkin,
  });
};
