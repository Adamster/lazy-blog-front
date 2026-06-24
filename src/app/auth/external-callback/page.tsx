"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthState, saveAuthState } from "@/shared/lib/auth-storage";
import { expiryFromToken } from "@/shared/lib/auth-refresh";
import { userKeys } from "@/entities/session";
import type { LoginResponse } from "@/shared/api/openapi";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Google OAuth landing page. The external provider redirects here after the
 * backend's `api/auth/external-callback` route has set the external-auth COOKIE;
 * we then call that route to exchange the cookie for our token pair.
 *
 * LIVE-TEST REQUIRED: this path is correct in code but depends on runtime infra
 * that can't be exercised in a unit test — the prod reverse-proxy mapping the
 * same-origin `/api/...` path to the backend, and the cookie's domain / SameSite
 * so it's sent as a first-party credential on this fetch. Verify the full Google
 * round-trip on a deployed environment after any change here.
 */
export default function ExternalCallbackPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      try {
        // Same-origin `/api/...` path (matches `loginWithGoogle`) so the
        // external-auth cookie is first-party, and `credentials: "include"` so
        // the browser actually sends it — the callback authenticates via that
        // cookie, NOT a bearer token. (Was hitting `/auth/...` without `/api`
        // and without credentials → the cookie never reached the backend.)
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
