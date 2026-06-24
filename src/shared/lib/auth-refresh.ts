import { API_URL } from "@/shared/types";
import {
  RefreshTokenResponse,
  RefreshTokenResponseFromJSON,
} from "@/shared/api/openapi";
import {
  AuthState,
  clearAuthState,
  getAuthState,
  saveAuthState,
} from "./auth-storage";

/** Access-token TTL handed out by the backend (30 min) — mirrored everywhere a session is minted. */
export const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Refresh proactively this long BEFORE the real expiry. The clock-skew window
 * keeps a request from going out with a token that dies in transit (and avoids
 * a refresh that races the expiry boundary).
 */
const REFRESH_SKEW_MS = 60 * 1000;

/** Same-tab broadcast so React state can re-sync after a middleware-driven refresh/clear. */
export const AUTH_CHANGED_EVENT = "auth-changed";

const dispatchAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

/**
 * True when the stored access token is at/past expiry (minus the skew window).
 * No `accessTokenExpires` means we can't reason about freshness → treat as not
 * expired and let the request proceed (the 401 safety-net still covers it).
 */
export const isAccessTokenExpired = (auth: AuthState): boolean => {
  if (!auth.accessTokenExpires) return false;
  return Date.now() >= auth.accessTokenExpires - REFRESH_SKEW_MS;
};

/**
 * Module-level in-flight promise so N concurrent requests that all observe an
 * expired token share ONE network refresh instead of stampeding the endpoint
 * (and racing each other to overwrite localStorage with stale rotated tokens).
 */
let inFlightRefresh: Promise<string | null> | null = null;

/**
 * Refresh the access token OUT OF BAND of `apiClient` — a plain `fetch` to the
 * refresh endpoint so this can be called from the api-client middleware without
 * a circular import or middleware recursion (the token `pre`/`post` hooks never
 * re-run for this call).
 *
 * Returns the new access token on success, or `null` when there's nothing to
 * refresh / the refresh failed (session genuinely over → auth cleared).
 * Concurrency-deduped: the in-flight promise is set synchronously before the
 * first await, so simultaneous callers await the same refresh.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = doRefresh().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
};

const doRefresh = async (): Promise<string | null> => {
  const currentAuth = getAuthState();
  if (!currentAuth.refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: currentAuth.refreshToken }),
    });

    if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

    const data: RefreshTokenResponse = RefreshTokenResponseFromJSON(
      await res.json()
    );

    const updatedAuth: AuthState = {
      ...currentAuth,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
    };

    saveAuthState(updatedAuth);
    return updatedAuth.accessToken;
  } catch (error) {
    console.error("Refresh Token Error:", error);
    clearAuthState();
    // Session is genuinely over — tell React to drop to logged-out instead of
    // showing authed UI that 401s on every call.
    dispatchAuthChanged();
    return null;
  }
};
