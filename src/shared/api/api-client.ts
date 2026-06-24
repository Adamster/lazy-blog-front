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

/**
 * Methods we'll auto-retry after a 401-triggered refresh. Kept to the
 * idempotent verbs (default GET) so a retry can NEVER double-apply a
 * non-idempotent mutation.
 *
 * 401-RETRY INVARIANT — a retry is safe ONLY because an HTTP 401 means the
 * request was rejected at the AUTHORIZATION gate, i.e. the vote/comment/upload
 * handler NEVER RAN and produced no side effect. Replaying it therefore can't
 * double-vote / double-post. Do NOT relax this to 5xx or to ANY status that can
 * be returned AFTER the handler has begun processing — that breaks the
 * invariant and a replay could double-apply. As defence-in-depth, even under
 * the invariant we only retry idempotent methods, so a future mistake here
 * can't silently double-submit a mutation. (The proactive `pre` refresh already
 * covers the common stale-token-on-POST case, so excluding POST from retry
 * costs us nothing in practice.)
 */
const RETRIABLE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const isRetriableMethod = (init: RequestInit): boolean =>
  RETRIABLE_METHODS.has((init.method ?? "GET").toUpperCase());

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
      //
      // Scoped to idempotent methods (see `RETRIABLE_METHODS` + the 401-retry
      // invariant above): a non-idempotent mutation is never auto-retried here,
      // so even if the invariant were ever violated it could not double-submit.
      async post(context) {
        if (context.response.status !== 401) return;
        if (!isRetriableMethod(context.init)) return;

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
  stats: new StatsApi(configuration),
  media: new MediaApi(configuration),
  changePassword: new ChangePasswordApi(configuration),
  forgotPassword: new ForgotPasswordApi(configuration),
  resetPassword: new ResetPasswordApi(configuration),
};
