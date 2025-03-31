import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUploadAvatar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      apiClient.users.uploadUserAvatar({ id: userId, file }),
    onSuccess: () => {
      addToastSuccess("Avatar updated!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userId],
      });
    },
    onError: (error) => {
      addToastError("Failed to update avatar", error);
    },
  });
};
