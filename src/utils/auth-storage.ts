const AUTH_STORAGE_KEY = "auth";

export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

export const isBrowser = typeof window !== "undefined";

export const getAuthState = (): AuthState => {
  if (!isBrowser)
    return {
      userId: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpires: null,
    };

  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  return storedAuth
    ? JSON.parse(storedAuth)
    : {
        userId: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpires: null,
      };
};

export const saveAuthState = (authState: AuthState) => {
  if (isBrowser) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  }
};

export const clearAuthState = () => {
  if (isBrowser) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};
