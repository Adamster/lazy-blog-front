/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { RegisterUserRequest } from "@/api/apis";
import { Loading } from "@/components/loading";
import { useAuthActions, useAuthState } from "@/hooks/use-auth";
import { AuthState } from "@/utils/auth-storage";
import React, { createContext } from "react";
import { UserProvider } from "./user-provider";

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  isAuthenticated: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: auth, isLoading: isAuthLoading } = useAuthState();
  const { login, logout, register } = useAuthActions();

  const isAuthenticated = !!auth?.userId;

  const status = isAuthLoading
    ? "loading"
    : isAuthenticated
    ? "authenticated"
    : "unauthenticated";

  if (status === "loading") {
    return <Loading compensateHeader={false} />;
  }

  return (
    <AuthContext.Provider
      value={{
        auth: auth!,
        login,
        logout,
        register,
        isAuthenticated,
        status,
      }}
    >
      <UserProvider userId={auth?.userId ?? null}>{children}</UserProvider>
    </AuthContext.Provider>
  );
}
