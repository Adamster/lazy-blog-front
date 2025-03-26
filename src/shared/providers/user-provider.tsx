"use client";

import { apiClient } from "@/shared/api/api-client";
import { UserResponse } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext } from "react";

interface UserContextType {
  user: UserResponse | undefined;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export function UserProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["getUserById", userId],
    queryFn: async () => {
      if (!userId) return undefined;
      return apiClient.users.getUserById({ id: userId });
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <Loading compensateHeader={false} />;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
