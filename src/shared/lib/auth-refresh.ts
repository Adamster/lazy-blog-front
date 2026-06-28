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
import { decodeJwtExp } from "./jwt";

// FALLBACK TTL — used only when the JWT `exp` can't be decoded (see expiryFromToken).
export const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

export const expiryFromToken = (accessToken: string): number =>
  decodeJwtExp(accessToken) ?? Date.now() + ACCESS_TOKEN_TTL_MS;

// Refresh this far BEFORE expiry so a request can't go out with a token that
// dies in transit (and a refresh doesn't race the expiry boundary).
const REFRESH_SKEW_MS = 60 * 1000;

export const AUTH_CHANGED_EVENT = "auth-changed";

const isDev = process.env.NODE_ENV !== "production";

const dispatchAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
};

// No `accessTokenExpires` → can't reason about freshness, so treat as not
// expired and let the request proceed (the 401 safety-net still covers it).
export const isAccessTokenExpired = (auth: AuthState): boolean => {
  if (!auth.accessTokenExpires) return false;
  return Date.now() >= auth.accessTokenExpires - REFRESH_SKEW_MS;
};

// In-tab dedupe so concurrent callers share ONE refresh (Web Locks below extends
// it across tabs).
let inFlightRefresh: Promise<string | null> | null = null;

/**
 * Refresh OUT OF BAND of `apiClient` (plain `fetch`) so the middleware can call
 * it without a circular import / recursion. Returns the new token, or `null`
 * when the session is over (auth cleared).
 *
 * Refresh tokens are SINGLE-USE + server-ROTATED: a second POST of the same token
 * 400s, so two callers/tabs must never both POST it. Three guards: (1) in-tab
 * in-flight dedupe; (2) Web Locks serialize across tabs; (3) a re-read freshness
 * check inside the lock returns an already-rotated-fresh token without POSTing.
 * Without `navigator.locks` (old Safari, non-secure, SSR) we degrade to #1 + #3.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = runRefreshSerialized().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
};

// A valid token (refreshing first if expired) for authed callers OUTSIDE the
// middleware that raw-`fetch` (e.g. Crepe image upload). `null` when no session.
export const getValidAccessToken = async (): Promise<string | null> => {
  const auth = getAuthState();
  if (!auth.accessToken) return null;
  if (isAccessTokenExpired(auth) && auth.refreshToken) {
    return refreshAccessToken();
  }
  return auth.accessToken;
};

const LOCK_NAME = "auth-refresh";

const runRefreshSerialized = (): Promise<string | null> => {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  if (!locks) {
    // No cross-tab lock → rely on the in-tab dedupe + `doRefresh`'s re-read guard.
    return doRefresh();
  }

  return locks.request(LOCK_NAME, () => doRefresh());
};

/**
 * Best-effort refresh-token revocation on logout. Plain `fetch` OUT OF BAND of
 * `apiClient`: the endpoint isn't in the OpenAPI spec yet, and we don't want the
 * token middleware keeping a session we're tearing down alive. Fire-and-forget —
 * never awaited, failures swallowed (backend is idempotent, so a stale token is
 * harmless). No-ops when a token is missing.
 */
export const revokeRefreshToken = (auth: AuthState): void => {
  if (!auth.accessToken || !auth.refreshToken) return;

  void fetch(`${API_URL}/api/users/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ refreshToken: auth.refreshToken }),
  }).catch((error) => {
    if (isDev) console.error("Logout Revoke Error:", error);
  });
};

const doRefresh = async (): Promise<string | null> => {
  // Re-read inside the critical section: a concurrent holder may have rotated
  // the token while we queued. POSTing the pre-read (now-consumed) token would
  // 400 → spurious forced logout, so return the now-fresh stored token instead.
  const currentAuth = getAuthState();
  if (!currentAuth.refreshToken) return null;
  if (currentAuth.accessToken && !isAccessTokenExpired(currentAuth)) {
    return currentAuth.accessToken;
  }

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

    // A 200 missing either token would persist `Bearer undefined` → 401 loop;
    // treat a malformed success as a failure (clear + notify).
    if (!data.accessToken || !data.refreshToken) {
      throw new Error("Refresh response missing tokens");
    }

    const updatedAuth: AuthState = {
      ...currentAuth,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: expiryFromToken(data.accessToken),
    };

    saveAuthState(updatedAuth);
    return updatedAuth.accessToken;
  } catch (error) {
    if (isDev) console.error("Refresh Token Error:", error);
    clearAuthState();
    dispatchAuthChanged();
    return null;
  }
};
