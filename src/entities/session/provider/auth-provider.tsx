import { RegisterUserRequest } from "@/shared/api/openapi";
import {
  useAuthActions,
  useAuthState,
} from "@/entities/session/model/use-auth";
import React, { createContext } from "react";
import { UserProvider } from "@/entities/session/provider/user-provider";
import { AuthState, EMPTY_AUTH } from "@/shared/lib/auth-storage";

// `"loading"` is distinct from `"unauthenticated"` so guards show a neutral
// state while localStorage resolves (client-only → a pending beat on first paint).
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  loginWithGoogle: () => void;
  isAuthenticated: boolean;
  authStatus: AuthStatus;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: auth, isPending } = useAuthState();
  const { login, logout, register, loginWithGoogle } = useAuthActions();

  const isAuthenticated = !!auth?.userId;

  const authStatus: AuthStatus = isPending
    ? "loading"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  // Render children unconditionally — gating the tree on resolution would render
  // a spinner shell on the server and defeat SSR for crawlers; the loading-aware
  // guards hold a neutral state until localStorage resolves on the client.
  return (
    <AuthContext.Provider
      value={{
        auth: auth ?? EMPTY_AUTH,
        login,
        logout,
        register,
        loginWithGoogle,
        isAuthenticated,
        authStatus,
      }}
    >
      <UserProvider userId={auth?.userId ?? null}>{children}</UserProvider>
    </AuthContext.Provider>
  );
}
