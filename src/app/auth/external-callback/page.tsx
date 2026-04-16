"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveAuthState } from "@/features/auth/lib/auth-storage";
import { API_URL } from "@/shared/types";

export default function ExternalCallbackPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/external-callback`);

        const data = await res.json();

        if (!res.ok)
          throw new Error(data?.detail || "External callback failed");

        const { accessToken, refreshToken, user } = data || {};

        if (user?.id && accessToken && refreshToken) {
          const authState = {
            userId: user.id as string,
            accessToken,
            refreshToken,
            accessTokenExpires: Date.now() + 30 * 60 * 1000,
          };

          saveAuthState(authState);
          queryClient.setQueryData(["auth"], authState);
          queryClient.setQueryData(["getUserById", user.id], user);
          window.location.replace("/");
        } else {
          throw new Error("Invalid callback payload");
        }
      } catch (e) {
        console.error("External callback failed", e);
        window.location.replace("/auth/login?error=external-callback");
      }
    })();
  }, [queryClient]);

  return null;
}
