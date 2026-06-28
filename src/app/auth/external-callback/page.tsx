"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthState, saveAuthState } from "@/shared/lib/auth-storage";
import { expiryFromToken } from "@/shared/lib/auth-refresh";
import { userKeys } from "@/entities/session";
import type { LoginResponse } from "@/shared/api/openapi";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Google OAuth landing page — exchanges the external-auth cookie for our token pair.
 *
 * LIVE-TEST REQUIRED: depends on runtime infra a unit test can't exercise — the
 * prod reverse-proxy mapping `/api/...` to the backend and the cookie's
 * domain / SameSite. Verify the full Google round-trip on a deployed env.
 */
export default function ExternalCallbackPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        // Same-origin `/api/...` + `credentials: "include"` so the external-auth
        // cookie is sent first-party — auth is via that cookie, not a bearer token.
        const res = await fetch("/api/auth/external-callback", {
          credentials: "include",
        });

        const data = (await res.json()) as Partial<LoginResponse> & {
          detail?: string;
        };

        if (!res.ok)
          throw new Error(data?.detail || "External callback failed");

        const { accessToken, refreshToken, user } = data;

        if (user?.id && accessToken && refreshToken) {
          const authState: AuthState = {
            userId: user.id,
            accessToken,
            refreshToken,
            // Anchor expiry to the token's own `exp` (scheduling only).
            accessTokenExpires: expiryFromToken(accessToken),
          };

          saveAuthState(authState);
          queryClient.setQueryData(["auth"], authState);
          queryClient.setQueryData(userKeys.byId(user.id), user);
          window.location.replace("/");
        } else {
          throw new Error("Invalid callback payload");
        }
      } catch (e) {
        if (isDev) console.error("External callback failed", e);
        window.location.replace("/?error=external-callback");
      }
    })();
  }, [queryClient]);

  return null;
}
