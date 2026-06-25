import { apiClient } from "@/shared/api/api-client";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/entities/session";

export const useDeleteAvatar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.users.deleteUserAvatar({ id: userId }),
    onSuccess: () => {
      addToastSuccess("Avatar gone. Back to initials.");

      queryClient.invalidateQueries({
        queryKey: userKeys.byId(userId),
      });
    },
    onError: (error) => {
      addToastError("Failed to delete avatar", error);
    },
  });
};
