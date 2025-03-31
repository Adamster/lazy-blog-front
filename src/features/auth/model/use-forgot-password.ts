import { apiClient } from "@/shared/api/api-client";
import { ForgotPasswordRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation } from "@tanstack/react-query";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => {
      return apiClient.forgotPassword.forgotPassword({
        forgotPasswordRequest: { email: data.email },
      });
    },
    onSuccess: () => {
      addToastSuccess("Password reset link sent to your email!");
    },
    onError: (error) => {
      addToastError("Failed to send reset link.", error);
    },
  });
};
