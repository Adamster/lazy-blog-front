import { RegisterUserRequest } from "@/shared/api/openapi";
import { Loading } from "@/shared/ui/loading";
import { useAuthActions, useAuthState } from "@/features/auth/model/use-auth";
import React, { createContext } from "react";
import { UserProvider } from "../../../shared/providers/user-provider";
import { AuthState } from "../lib/auth-storage";

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: auth, isLoading: isAuthLoading } = useAuthState();
  const { login, logout, register } = useAuthActions();

  const isAuthenticated = !!auth?.userId;

  if (isAuthLoading) {
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
      }}
    >
      <UserProvider userId={auth?.userId ?? null}>{children}</UserProvider>
    </AuthContext.Provider>
  );
}
