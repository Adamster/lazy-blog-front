import { apiClient } from "@/shared/api/api-client";
import { UpdateUserRequest } from "@/shared/api/openapi";
import { addToastError, addToastSuccess } from "@/shared/lib/toasts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      apiClient.users.updateUser({
        id: userId,
        updateUserRequest: {
          firstName: data.firstName,
          lastName: data.lastName,
          userName: data.userName,
          biography: data.biography,
        },
      }),

    onSuccess: () => {
      addToastSuccess("Profile successfully updated!");

      queryClient.invalidateQueries({
        queryKey: ["getUserById", userId],
      });
    },

    onError: (error) => {
      addToastError("Failed to update profile", error);
    },
  });
};
