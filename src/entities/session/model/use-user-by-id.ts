import { apiClient } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";

export const useUserById = (userId: string) =>
  useQuery({
    queryKey: ["getUserById", userId],
    queryFn: () => apiClient.users.getUserById({ id: userId }),
    enabled: Boolean(userId),
  });
