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
import { AUTH_CHANGED_EVENT, expiryFromToken } from "@/shared/lib/auth-refresh";
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

  // Keep the `["auth"]` cache in sync with localStorage from BOTH directions of
  // out-of-band change:
  //   • `auth-changed` (same tab) — the api-client middleware refreshes/clears
  //     the session by writing localStorage, not the query cache. On a failed
  //     refresh this drops the UI to logged-out instead of leaving authed chrome
  //     that 401s on every call; on a success it's a harmless re-read.
  //   • `storage` (OTHER tabs) — a refresh/clear in a sibling tab rotates the
  //     token in localStorage but fires NO `auth-changed` here. Without this,
  //     this tab would keep serving the now-rotated token from its cache and
  //     401-loop. The `storage` event only fires in tabs OTHER than the writer,
  //     so it's exactly the cross-tab gap the same-tab event misses.
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

  // PURE READER: just mirror localStorage into the cache. The api-client
  // middleware now guarantees no request leaves with a dead token (proactive
  // `pre` refresh + 401 safety net), so the cache no longer needs to pre-refresh
  // on read. `isAuthenticated` keys off `userId`, so a momentarily-stale token
  // sitting in the cache is harmless — the next request refreshes it in-band.
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
        // Anchor expiry to the token's own `exp` (scheduling only), not a
        // hardcoded TTL + the client clock at receipt.
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

  // Synchronous: this only navigates the browser away (the page unloads), so the
  // old `async`/`Promise<void>` signature was misleading — there's nothing to
  // await.
  const loginWithGoogle = () => {
    const returnUrl = `${window.location.origin}/api/auth/external-callback`;

    const loginUrl =
      `${window.location.origin}/api/auth/Google/login?` +
      new URLSearchParams({ returnUrl }).toString();

    window.location.assign(loginUrl);
  };

  const logout = () => {
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
