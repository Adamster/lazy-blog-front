import { apiClient } from "@/shared/api/api-client";
import { RegisterUserRequest, ResponseError } from "@/shared/api/openapi";
import { AuthContext } from "@/entities/session/provider/auth-provider";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import {
  AUTH_STORAGE_KEY,
  AuthState,
  clearAuthState,
  getAuthState,
  saveAuthState,
} from "@/shared/lib/auth-storage";
import {
  AUTH_CHANGED_EVENT,
  expiryFromToken,
  revokeRefreshToken,
} from "@/shared/lib/auth-refresh";
import { userKeys } from "./user-keys";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const useAuthState = () => {
  const queryClient = useQueryClient();

  // Sync the `["auth"]` cache with out-of-band localStorage writes: `auth-changed`
  // covers same-tab middleware refresh/clear; `storage` covers OTHER tabs (it
  // fires only in non-writer tabs, the cross-tab gap the same-tab event misses).
  useEffect(() => {
    const sync = () => queryClient.setQueryData(["auth"], getAuthState());

    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY || event.key === null) sync();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient]);

  // Pure reader — the api-client middleware guarantees no request leaves with a
  // dead token, so the cache needn't pre-refresh on read (a stale token here is
  // harmless: `isAuthenticated` keys off `userId`, next request refreshes it).
  return useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: () => getAuthState(),
    staleTime: Infinity,
  });
};

export const useAuthActions = () => {
  const queryClient = useQueryClient();

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.users.login({
        loginRequest: { email, password },
      });

      const authState: AuthState = {
        userId: response.user.id!,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpires: expiryFromToken(response.accessToken),
      };

      saveAuthState(authState);

      queryClient.setQueryData(["auth"], authState);
      queryClient.setQueryData(userKeys.byId(response.user.id), response.user);
    } catch (error) {
      clearAuthState();

      queryClient.setQueryData(["auth"], getAuthState());

      throw new Error(
        error instanceof ResponseError
          ? (await error.response.json()).detail || "Login failed"
          : "Login failed"
      );
    }
  };

  const loginWithGoogle = () => {
    // returnUrl is the FRONTEND page (not the backend `/api/...`): the browser
    // lands here after Google, then that page exchanges the cookie for tokens.
    // Pointing at `/api/...` would land the browser on raw JSON.
    const returnUrl = `${window.location.origin}/auth/external-callback`;

    const loginUrl =
      `${window.location.origin}/api/auth/Google/login?` +
      new URLSearchParams({ returnUrl }).toString();

    window.location.assign(loginUrl);
  };

  const logout = () => {
    // Fire-and-forget revoke (never awaited) so a network failure or 401 can't
    // keep the user logged in; tear down locally regardless.
    revokeRefreshToken(getAuthState());

    clearAuthState();

    queryClient.setQueryData(["auth"], getAuthState());
    queryClient.removeQueries({ queryKey: userKeys.byId() });
  };

  const register = async (registerData: RegisterUserRequest) => {
    try {
      await apiClient.users.register({ registerUserRequest: registerData });
      await login(registerData.email, registerData.password);
    } catch (error) {
      throw new Error(
        error instanceof ResponseError
          ? (await error.response.json()).detail || "Registration failed"
          : "Registration failed"
      );
    }
  };

  return { login, logout, register, loginWithGoogle };
};
