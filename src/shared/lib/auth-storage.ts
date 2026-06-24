/** The localStorage key the auth snapshot lives under. */
export const AUTH_STORAGE_KEY = "auth";

export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

/**
 * The single canonical "logged-out" snapshot. Hoisted here so every consumer
 * (storage reader, auth provider fallback, login-error reset) shares ONE shape
 * instead of re-declaring the empty object — DRY, and a guarantee they can't
 * drift apart.
 */
export const EMPTY_AUTH: AuthState = {
  userId: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpires: null,
};

const emptyAuth = (): AuthState => ({ ...EMPTY_AUTH });

export const getAuthState = (): AuthState => {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedAuth) return emptyAuth();

  try {
    return JSON.parse(storedAuth) as AuthState;
  } catch {
    // A corrupt `auth` key (truncated write, manual tampering, a half-migrated
    // value) used to throw on EVERY render of every component that reads auth —
    // a total client lockout with no way out but devtools. Treat corruption as
    // "no session": purge the bad value and fall back to logged-out so the app
    // stays usable and the user can simply log in again.
    clearAuthState();
    return emptyAuth();
  }
};

export const saveAuthState = (authState: AuthState) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

export const clearAuthState = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
