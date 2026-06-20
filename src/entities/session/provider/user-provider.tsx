"use client";

import { useUserById } from "@/entities/session/model/use-user-by-id";
import { UserResponse } from "@/shared/api/openapi";
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
  // Render children unconditionally (no blocking spinner) so the server tree
  // reaches the HTML for crawlers. `user` is `undefined` until the query
  // resolves on the client; consumers already treat it as optional and the
  // interactive islands re-render once it lands.
  const { data: user } = useUserById(userId || "");

  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}
