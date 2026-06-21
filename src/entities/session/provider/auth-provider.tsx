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

/**
 * Three-state auth resolution. `"loading"` is distinct from `"unauthenticated"`
 * so guards can show a neutral state while `useAuthState` resolves from
 * localStorage instead of flashing a denied/redirect fallback (the read of
 * localStorage is client-only, so there's always a pending beat on first paint).
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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

  // `isPending` is the query's "not yet resolved" beat (it always resolves to a
  // concrete AuthState, never `undefined`, so success === resolved). On SSR /
  // first client paint the query is pending → `authStatus: "loading"`; guards
  // read this to show a neutral state instead of a denied fallback.
  const authStatus: AuthStatus = isPending
    ? "loading"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  // Render children unconditionally (no blocking spinner): auth is resolved from
  // localStorage on the client only, so gating the whole tree on `isLoading`
  // would render an empty/spinner shell on the server and defeat SSR for
  // crawlers. Until the query resolves, `auth` falls back to an empty
  // (logged-out) state and `authStatus` is `"loading"`; the loading-aware guards
  // (IsAuth / IsAuthor / ProtectedRoute) hold a neutral state until it lands.
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
