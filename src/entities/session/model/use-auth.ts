import { apiClient } from "@/shared/api/api-client";
import { RegisterUserRequest, ResponseError } from "@/shared/api/openapi";
import { AuthContext } from "@/entities/session/provider/auth-provider";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import {
  AuthState,
  clearAuthState,
  getAuthState,
  saveAuthState,
} from "@/shared/lib/auth-storage";
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

  return useQuery<AuthState>({
    queryKey: ["auth"],
    queryFn: async () => {
      const storedAuth = getAuthState();

      if (
        storedAuth.accessTokenExpires &&
        Date.now() >= storedAuth.accessTokenExpires
      ) {
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
        accessTokenExpires: Date.now() + 30 * 60 * 1000,
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

export const refreshToken = async (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  const currentAuth = getAuthState();
  if (!currentAuth.refreshToken) return;

  try {
    const response = await apiClient.users.refreshToken({
      refreshTokenRequest: { refreshToken: currentAuth.refreshToken },
    });

    const updatedAuth: AuthState = {
      ...currentAuth,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      accessTokenExpires: Date.now() + 30 * 60 * 1000,
    };

    saveAuthState(updatedAuth);

    queryClient.setQueryData(["auth"], updatedAuth);
  } catch (error) {
    console.error("Refresh Token Error:", error);
    clearAuthState();

    queryClient.setQueryData(["auth"], getAuthState());
    queryClient.removeQueries({ queryKey: userKeys.byId() });
  }
};
