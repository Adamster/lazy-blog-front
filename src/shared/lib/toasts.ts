import React from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { ResponseError } from "@/shared/api/openapi";
import { addToast } from "@heroui/react";

// Mono/brutalist toast skin. Toasts portal to <body> (outside `.mono-scope`,
// so the `--m-*` tokens don't resolve there) — use the dark mono palette
// literally. We use `color: "default"` (NOT success/danger) so HeroUI doesn't
// tint the background green/red or round the close button; the look is fully
// driven by classNames + a custom icon. Square, 2px frame + 2px accent left
// edge (lime = success, red = error).
const toastSkin = (edge: string) => ({
  base: `!rounded-none [&_*]:!rounded-none border-2 border-l-2 !border-[#2c2c2c] ${edge} !bg-[#1a1a1a] shadow-none`,
  wrapper: "!rounded-none !bg-transparent",
  icon: "!rounded-none !bg-transparent",
  content: "!rounded-none !bg-transparent",
  title: "font-bold text-[14px] tracking-[0.01em] text-[#dcdcdc]",
  description: "text-[12px] leading-[1.5] text-[#9a9a9a]",
  closeButton:
    "!rounded-none border-0 opacity-100 text-[#6f6f6f] data-[hover=true]:bg-[#262626] data-[hover=true]:text-[#dcdcdc]",
});

const successSkin = toastSkin("!border-l-[#cdff48]");
const errorSkin = toastSkin("!border-l-[#ff6b6b]");

export const addToastSuccess = (message: string) => {
  addToast({
    title: "Success",
    description: message,
    color: "default",
    variant: "flat",
    icon: React.createElement(CheckIcon, {
      className: "size-5 text-[#cdff48]",
    }),
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
    color: "default",
    variant: "flat",
    icon: React.createElement(XMarkIcon, {
      className: "size-5 text-[#ff6b6b]",
    }),
    classNames: errorSkin,
  });
};
