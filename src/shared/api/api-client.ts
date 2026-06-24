import { getAuthState } from "@/shared/lib/auth-storage";
import {
  isAccessTokenExpired,
  refreshAccessToken,
} from "@/shared/lib/auth-refresh";
import { API_URL } from "@/shared/types";
import {
  ChangePasswordApi,
  CommentsApi,
  ForgotPasswordApi,
  MediaApi,
  PostsApi,
  ResetPasswordApi,
  TagsApi,
  UsersApi,
} from "./openapi";
import { Configuration } from "./openapi";

const withAuthHeader = (
  init: RequestInit,
  accessToken: string
): RequestInit => ({
  ...init,
  headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
});

const configuration = new Configuration({
  basePath: API_URL,
  middleware: [
    {
      // PRIMARY FIX: proactively refresh BEFORE the request goes out. If the
      // token is (about to be) expired and we hold a refresh token, swap it for
      // a fresh one first so a request never leaves with a dead token. The
      // refresh is concurrency-deduped, so a burst of simultaneous requests
      // shares one refresh call.
      async pre(context) {
        const auth = getAuthState();

        if (auth.refreshToken && isAccessTokenExpired(auth)) {
          const fresh = await refreshAccessToken();
          if (fresh) {
            context.init.headers = withAuthHeader(context.init, fresh).headers;
            return;
          }
        }

        if (auth.accessToken) {
          context.init.headers = withAuthHeader(
            context.init,
            auth.accessToken
          ).headers;
        }
      },
      // SAFETY NET: if a request still comes back 401 (clock skew, a token
      // revoked server-side mid-session, or the very first idle request that
      // outran the proactive check), refresh ONCE and retry. The retry uses the
      // global `fetch` — NOT `context.fetch`, which is the middleware-wrapped
      // fetch and would re-enter this hook and loop. Single retry, no recursion.
      async post(context) {
        if (context.response.status !== 401) return;

        const auth = getAuthState();
        if (!auth.refreshToken) return;

        const fresh = await refreshAccessToken();
        if (!fresh) return; // refresh failed → session over; surface the 401

        return fetch(context.url, withAuthHeader(context.init, fresh));
      },
    },
  ],
});

export const apiClient = {
  users: new UsersApi(configuration),
  posts: new PostsApi(configuration),
  comments: new CommentsApi(configuration),
  tags: new TagsApi(configuration),
  media: new MediaApi(configuration),
  changePassword: new ChangePasswordApi(configuration),
  forgotPassword: new ForgotPasswordApi(configuration),
  resetPassword: new ResetPasswordApi(configuration),
};
