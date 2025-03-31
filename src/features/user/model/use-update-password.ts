import { useAuth } from "@/features/auth/model/use-auth";
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
      addToastSuccess("Password successfully changed!");
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
