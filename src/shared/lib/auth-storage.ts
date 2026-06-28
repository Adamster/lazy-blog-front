export const AUTH_STORAGE_KEY = "auth";

export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

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
    // A corrupt `auth` key would otherwise throw on every read → total client
    // lockout; treat corruption as "no session" (purge + logged-out).
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
