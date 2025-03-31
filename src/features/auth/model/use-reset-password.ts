import { apiClient } from "@/shared/api/api-client";
import { ResetPasswordRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation } from "@tanstack/react-query";

export const useResetPassword = (email: string, token: string) => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => {
      return apiClient.resetPassword.resetPassword({
        resetPasswordRequest: { ...data, email, token },
      });
    },
    onSuccess: () => {
      addToastSuccess("Your password has been reset successfully!");
    },
    onError: (error) => {
      addToastError("Password reset failed.", error);
    },
  });
};
