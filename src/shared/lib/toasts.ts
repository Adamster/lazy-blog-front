import { ResponseError } from "@/shared/api/openapi";
import { addToast } from "@heroui/react";

export const addToastSuccess = (message: string) => {
  addToast({
    title: "Success",
    description: message,
    color: "success",
    variant: "flat",
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
  });
};
