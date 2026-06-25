import { useAuth } from "@/entities/session";
import { apiClient } from "@/shared/api/api-client";
import { ChangePasswordRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useUpdatePassword = () => {
  const router = useRouter();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: ChangePasswordRequest) =>
      apiClient.changePassword.changePassword({
        changePasswordRequest: { oldPassword, newPassword },
      }),
    onSuccess: () => {
      addToastSuccess("Password changed. Don't forget this one too.");
      router.push("/");

      setTimeout(() => {
        logout();
      }, 300);
    },
    onError: (error) => {
      addToastError("Failed to change password", error);
    },
  });
};
