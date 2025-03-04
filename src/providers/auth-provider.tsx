/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ResponseError } from "@/api/apis";
import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { UserResponse, RegisterUserRequest } from "@/api/apis";
import { Loading } from "@/components/loading";
import {
  getAuthState,
  saveAuthState,
  clearAuthState,
} from "@/utils/auth-storage";

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

interface AuthContextType {
  auth: AuthState;
  user: UserResponse | undefined;
  refetchUserData: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  register: (registerData: RegisterUserRequest) => Promise<void>;
  isAuthenticated: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: auth = getAuthState(), isLoading: isAuthLoading } =
    useQuery<AuthState>({
      queryKey: ["auth"],
      queryFn: async () => {
        const storedAuth = getAuthState();

        if (
          storedAuth.accessTokenExpires &&
          Date.now() >= storedAuth.accessTokenExpires
        ) {
          await refreshToken();
          return getAuthState();
        }

        return storedAuth;
      },
      staleTime: Infinity,
    });

  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUserData,
  } = useQuery<UserResponse | undefined>({
    queryKey: ["user", auth?.userId],
    queryFn: async () => {
      if (!auth.userId) {
        return Promise.resolve(null as unknown as UserResponse);
      }
      return apiClient.users.getUserById({ id: auth.userId });
    },
    enabled: Boolean(auth?.userId),
  });

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
      queryClient.setQueryData(["user", response.user.id], response.user);
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

  const logout = () => {
    clearAuthState();
    queryClient.setQueryData(["auth"], getAuthState());
    queryClient.removeQueries({ queryKey: ["user"] });
  };

  const refreshToken = async () => {
    if (!auth.refreshToken) return;

    try {
      const response = await apiClient.users.refreshToken({
        refreshTokenRequest: { refreshToken: auth.refreshToken },
      });

      const updatedAuth: AuthState = {
        ...auth,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpires: Date.now() + 30 * 60 * 1000,
      };

      saveAuthState(updatedAuth);
      queryClient.setQueryData(["auth"], updatedAuth);
    } catch {
      logout();
    }
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

  const isAuthenticated = !!auth.userId && !!userData;
  const status =
    isAuthLoading || isUserLoading
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
        auth,
        user: userData,
        refetchUserData,
        login,
        logout,
        refreshToken,
        register,
        isAuthenticated,
        status,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
