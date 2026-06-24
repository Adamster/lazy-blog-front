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

/**
 * FALLBACK access-token TTL. The expiry is now anchored to the JWT's own `exp`
 * claim (see `expiryFromToken`); this 30-min constant is used ONLY when the
 * token can't be decoded, so the schedule never silently couples to a backend
 * constant or to the client clock at the moment of receipt.
 */
export const ACCESS_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Compute `accessTokenExpires` from the access token itself. We trust the
 * server-issued `exp` (scheduling only — see `decodeJwtExp`) so the refresh
 * fires against the real expiry regardless of client-clock drift at receipt;
 * if the token is opaque/unparseable we fall back to `now + TTL`.
 */
export const expiryFromToken = (accessToken: string): number =>
  decodeJwtExp(accessToken) ?? Date.now() + ACCESS_TOKEN_TTL_MS;

/**
 * Refresh proactively this long BEFORE the real expiry. The clock-skew window
 * keeps a request from going out with a token that dies in transit (and avoids
 * a refresh that races the expiry boundary).
 */
const REFRESH_SKEW_MS = 60 * 1000;

/** Same-tab broadcast so React state can re-sync after a middleware-driven refresh/clear. */
export const AUTH_CHANGED_EVENT = "auth-changed";

const isDev = process.env.NODE_ENV !== "production";

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
 * Module-level in-flight promise so N concurrent requests IN THIS TAB that all
 * observe an expired token share ONE network refresh instead of stampeding the
 * endpoint (and racing each other to overwrite localStorage with stale rotated
 * tokens). The Web Locks API (below) extends this same guarantee ACROSS tabs.
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
 *
 * CONCURRENCY — refresh tokens are SINGLE-USE and ROTATED server-side: a given
 * refresh token works exactly once, and a second POST with the same token gets
 * an HTTP 400. So two requests (or two tabs) must NEVER both POST the same
 * token, or the loser is force-logged-out spuriously. We guard on three levels:
 *   1. Module in-flight dedupe (collapses concurrent callers in THIS tab).
 *   2. Web Locks (`navigator.locks`) — serializes refresh ACROSS tabs so only
 *      one tab holds the lock and POSTs; the others run their critical section
 *      afterward and hit guard #3.
 *   3. A re-read freshness guard INSIDE the lock: if another holder already
 *      refreshed while we waited, the token in storage is now fresh, so we
 *      return it WITHOUT POSTing the (now-rotated, would-400) token we'd read
 *      earlier.
 * When `navigator.locks` is unavailable (older Safari, non-secure context,
 * SSR), we degrade gracefully to #1 + #3 alone — still correct within a tab,
 * just without the cross-tab serialization.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = runRefreshSerialized().finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
};

const LOCK_NAME = "auth-refresh";

const runRefreshSerialized = (): Promise<string | null> => {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;

  if (!locks) {
    // Graceful fallback: no cross-tab lock available → rely on the in-tab
    // in-flight dedupe + the re-read freshness guard inside `doRefresh`.
    return doRefresh();
  }

  return locks.request(LOCK_NAME, () => doRefresh());
};

const doRefresh = async (): Promise<string | null> => {
  // Re-read INSIDE the critical section: a concurrent holder (another tab, or
  // an earlier call that won the lock) may have already rotated the token while
  // we were queued. If what's in storage is now fresh, use it — POSTing the
  // token we'd have read before would replay an already-consumed (rotated)
  // token and earn a spurious 400 → forced logout.
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

    // Guard the body: a 200 that's somehow missing either token would otherwise
    // persist `Bearer undefined` and put every subsequent request into a 401
    // loop. Treat a malformed success exactly like a failure (clear + notify).
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
    // Session is genuinely over — tell React to drop to logged-out instead of
    // showing authed UI that 401s on every call.
    dispatchAuthChanged();
    return null;
  }
};
