"use client";

import { useUserById } from "@/features/user/model/use-user-by-id";
import { UserResponse } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import React, { createContext, useContext } from "react";

interface UserContextType {
  user: UserResponse | undefined;
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
  const { data: user, isLoading } = useUserById(userId || "");

  return isLoading ? (
    <Loading compensateHeader={false} />
  ) : (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}
