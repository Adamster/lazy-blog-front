import { RegisterUserRequest } from "@/shared/api/openapi";
import {
  useAuthActions,
  useAuthState,
} from "@/entities/session/model/use-auth";
import React, { createContext } from "react";
import { UserProvider } from "@/entities/session/provider/user-provider";
import { AuthState } from "@/shared/lib/auth-storage";

const EMPTY_AUTH: AuthState = {
  userId: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpires: null,
};

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: auth } = useAuthState();
  const { login, logout, register, loginWithGoogle } = useAuthActions();

  const isAuthenticated = !!auth?.userId;

  // Render children unconditionally (no blocking spinner): auth is resolved from
  // localStorage on the client only, so gating on `isLoading` would render an
  // empty/spinner shell on the server and defeat SSR for crawlers. Until the
  // query resolves, `auth` falls back to an empty (logged-out) state; the
  // interactive islands re-render when it lands.
  return (
    <AuthContext.Provider
      value={{
        auth: auth ?? EMPTY_AUTH,
        login,
        logout,
        register,
        loginWithGoogle,
        isAuthenticated,
      }}
    >
      <UserProvider userId={auth?.userId ?? null}>{children}</UserProvider>
    </AuthContext.Provider>
  );
}
