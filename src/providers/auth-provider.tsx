/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ResponseError } from "@/api/apis";
import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/api-client";
import { UserResponse, RegisterUserRequest } from "@/api/apis";
import { Loading } from "@/components/loading";

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

interface AuthContextType {
  auth: AuthState;
  user: UserResponse | null;
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

  const getInitialAuthState = (): AuthState => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedAuth = localStorage.getItem("auth");
      return storedAuth
        ? JSON.parse(storedAuth)
        : {
            userId: null,
            accessToken: null,
            refreshToken: null,
            accessTokenExpires: null,
          };
    }
    return {
      userId: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpires: null,
    };
  };

  const { data: auth = getInitialAuthState(), isLoading: isAuthLoading } =
    useQuery({
      queryKey: ["auth"],
      queryFn: async () => {
        if (typeof window !== "undefined" && window.localStorage) {
          const storedAuth = localStorage.getItem("auth");
          if (!storedAuth) return getInitialAuthState();

          const parsedAuth: AuthState = JSON.parse(storedAuth);

          if (
            parsedAuth.accessTokenExpires &&
            Date.now() >= parsedAuth.accessTokenExpires
          ) {
            await refreshToken();
            const updatedAuth = localStorage.getItem("auth");
            return updatedAuth ? JSON.parse(updatedAuth) : parsedAuth;
          }
          return parsedAuth;
        }
        return getInitialAuthState();
      },
      staleTime: Infinity,
    });

  const {
    data: userData,
    isLoading: isUserLoading,
    refetch: refetchUserData,
  } = useQuery<UserResponse>({
    queryKey: ["user", auth?.userId],
    queryFn: () => apiClient.users.getUserById({ id: auth?.userId || "" }),
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

      localStorage.setItem("auth", JSON.stringify(authState));
      queryClient.setQueryData(["auth"], authState);
      queryClient.setQueryData(["user", response.user.id], response.user);
    } catch (error: any) {
      const authState: AuthState = {
        userId: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpires: null,
      };

      localStorage.removeItem("auth");
      queryClient.setQueryData(["auth"], authState);

      let message = "Login failed";
      if (error instanceof ResponseError) {
        const errorBody = await error.response.json();
        message = errorBody.detail || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth");

    queryClient.setQueryData(["auth"], {
      userId: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpires: null,
    });

    queryClient.removeQueries({ queryKey: ["user"] });
  };

  const refreshToken = async () => {
    if (!auth.refreshToken) return;

    try {
      const response = await apiClient.users.refreshToken({
        refreshTokenRequest: { refreshToken: auth.refreshToken },
      });

      const updatedAuth: AuthState = {
        userId: auth.userId,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpires: Date.now() + 30 * 60 * 1000,
      };

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("auth", JSON.stringify(updatedAuth));
      }

      queryClient.setQueryData(["auth"], updatedAuth);
    } catch (error) {
      console.error("Failed to refresh token", error);
      logout();
    }
  };

  const register = async (registerData: RegisterUserRequest) => {
    try {
      await apiClient.users.register({
        registerUserRequest: registerData,
      });
      await login(registerData.email, registerData.password);
    } catch (error: any) {
      let message = "Registration failed";
      if (error instanceof ResponseError) {
        const errorBody = await error.response.json();
        message = errorBody.detail || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      throw new Error(message);
    }
  };

  // useEffect(() => {
  //   if (auth.accessTokenExpires && Date.now() >= auth.accessTokenExpires) {
  //     refreshToken();
  //   }
  // }, [auth]);

  const isAuthenticated = !!auth.userId && !!userData;
  const status =
    isAuthLoading || isUserLoading
      ? "loading"
      : isAuthenticated
      ? "authenticated"
      : "unauthenticated";

  const value: AuthContextType = {
    auth,
    user: userData || null,
    refetchUserData,
    login,
    logout,
    refreshToken,
    register,
    isAuthenticated,
    status,
  };

  if (status === "loading") {
    return <Loading compensateHeader={false} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
