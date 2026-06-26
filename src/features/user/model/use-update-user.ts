import { apiClient } from "@/shared/api/api-client";
import { UpdateUserRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/entities/session";

export const useUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      apiClient.users.updateUser({
        id: userId,
        updateUserRequest: {
          displayName: data.displayName,
          userName: data.userName,
          biography: data.biography,
        },
      }),

    onSuccess: () => {
      addToastSuccess("Profile successfully updated!");

      queryClient.invalidateQueries({
        queryKey: userKeys.byId(userId),
      });
    },

    onError: (error) => {
      addToastError("Failed to update profile", error);
    },
  });
};
