import { apiClient } from "@/shared/api/api-client";
import { useQuery } from "@tanstack/react-query";
import { userKeys } from "./user-keys";

export const useUserById = (userId: string) =>
  useQuery({
    queryKey: userKeys.byId(userId),
    queryFn: () => apiClient.users.getUserById({ id: userId }),
    enabled: Boolean(userId),
  });
