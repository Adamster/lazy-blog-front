import { getAuthState } from "@/shared/lib/auth-storage";
import {
  isAccessTokenExpired,
  refreshAccessToken,
} from "@/shared/lib/auth-refresh";
import { API_URL } from "@/shared/types";
import {
  ArcadeApi,
  ChangePasswordApi,
  CommentsApi,
  ForgotPasswordApi,
  MediaApi,
  PostsApi,
  ResetPasswordApi,
  StatsApi,
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

// 401-RETRY INVARIANT — a 401 is rejected at the auth gate, so the handler never
// ran (no side effect) and a replay can't double-apply. Do NOT relax to 5xx or
// any post-handler status. Restricted to idempotent verbs as defence-in-depth so
// a future mistake still can't double-submit a mutation.
const RETRIABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const isRetriableMethod = (init: RequestInit): boolean =>
  RETRIABLE_METHODS.has((init.method ?? "GET").toUpperCase());

const configuration = new Configuration({
  basePath: API_URL,
  middleware: [
    {
      // Proactively refresh BEFORE the request so it never leaves with a dead
      // token; the refresh is concurrency-deduped across a burst of requests.
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
      // Safety net for a 401 that outran the proactive refresh: refresh ONCE and
      // retry (idempotent methods only — see the invariant above). The retry uses
      // the global `fetch`, NOT `context.fetch`, which would re-enter this hook
      // and loop.
      async post(context) {
        if (context.response.status !== 401) return;
        if (!isRetriableMethod(context.init)) return;

        const auth = getAuthState();
        if (!auth.refreshToken) return;

        const fresh = await refreshAccessToken();
        if (!fresh) return;

        return fetch(context.url, withAuthHeader(context.init, fresh));
      },
    },
  ],
});

export const apiClient = {
  arcade: new ArcadeApi(configuration),
  users: new UsersApi(configuration),
  posts: new PostsApi(configuration),
  comments: new CommentsApi(configuration),
  tags: new TagsApi(configuration),
  stats: new StatsApi(configuration),
  media: new MediaApi(configuration),
  changePassword: new ChangePasswordApi(configuration),
  forgotPassword: new ForgotPasswordApi(configuration),
  resetPassword: new ResetPasswordApi(configuration),
};
