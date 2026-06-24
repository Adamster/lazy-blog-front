import { apiClient } from "@/shared/api/api-client";
import { RegisterUserRequest, ResponseError } from "@/shared/api/openapi";
import { AuthContext } from "@/entities/session/provider/auth-provider";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import {
  AuthState,
  clearAuthState,
  getAuthState,
  saveAuthState,
} from "@/shared/lib/auth-storage";
import {
  ACCESS_TOKEN_TTL_MS,
  AUTH_CHANGED_EVENT,
  isAccessTokenExpired,
  refreshAccessToken,
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

  // Re-sync the `["auth"]` cache whenever the api-client middleware refreshes or
  // clears the session out of band (it writes localStorage but not the query
  // cache). On a failed refresh this drops the UI to logged-out instead of
  // leaving authed chrome that 401s on every call; on a successful refresh it's
  // a harmless re-read (userId is unchanged).
  useEffect(() => {
    const sync = () => queryClient.setQueryData(["auth"], getAuthState());
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, [queryClient]);

  return useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedAuth = getAuthState();

      if (storedAuth.refreshToken && isAccessTokenExpired(storedAuth)) {
        await refreshToken(queryClient);
        return getAuthState();
      }

      return storedAuth;
    },
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
        accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
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

  const loginWithGoogle = async () => {
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

/**
 * React-aware wrapper over the shared, deduped `refreshAccessToken()`: it owns
 * the network refresh + localStorage write; this only syncs the result into the
 * query cache. On a failed refresh (`null`) the session is over, so drop the
 * user cache too.
 */
export const refreshToken = async (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  const newToken = await refreshAccessToken();

  queryClient.setQueryData(["auth"], getAuthState());

  if (!newToken) {
    queryClient.removeQueries({ queryKey: userKeys.byId() });
  }
};
