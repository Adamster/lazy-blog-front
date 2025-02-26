/* eslint-disable @typescript-eslint/no-explicit-any */

import { ResponseError } from "@/api/apis";
import { addToast } from "@heroui/react";

export const addToastSuccess = (message: string) => {
  addToast({
    title: "Success",
    description: message,
    color: "success",
    variant: "flat",
  });
};

export const addToastError = async (message: string, error?: any) => {
  if (error && error instanceof ResponseError) {
    const errorBody = await error.response.json();
    message = errorBody.detail || message;
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
