const AUTH_STORAGE_KEY = "auth";

export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
}

export const getAuthState = (): AuthState => {
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
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
};

export const clearAuthState = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
