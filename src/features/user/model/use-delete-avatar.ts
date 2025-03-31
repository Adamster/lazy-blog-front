import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteAvatar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.users.deleteUserAvatar({ id: userId }),
    onSuccess: () => {
      addToastSuccess("Avatar deleted!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userId],
      });
    },
    onError: (error) => {
      addToastError("Failed to delete avatar", error);
    },
  });
};
