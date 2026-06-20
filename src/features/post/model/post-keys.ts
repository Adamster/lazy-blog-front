/**
 * Typed query-key factory for the `post` feature — the single source of truth
 * for every post-related cache entry. Client hooks AND the SSR `setQueryData`
 * seeds in the App Router `page.tsx` files route through this so the
 * server-rendered seed lands on the exact key the client hook reads (otherwise
 * hydration silently
 * misses). Keys mirror the resource shape so invalidating a broad key
 * (`list()`, `byUser()`) also invalidates its paginated children.
 */
export const postKeys = {
  /** Root namespace for the home feed; `list()` is the canonical alias. */
  all: () => ["getAllPosts"] as const,
  /** Home feed (infinite). */
  list: () => ["getAllPosts"] as const,
  /** A user's profile feed (infinite). Omit `userName` to match every user feed (broad invalidation). */
  byUser: (userName?: string) =>
    (userName === undefined
      ? ["getPostsByUserName"]
      : ["getPostsByUserName", userName]) as readonly [string, string?],
  /** A tag's feed (infinite). Omit `tag` to match every tag feed (broad invalidation). */
  byTag: (tag?: string) =>
    (tag === undefined
      ? ["getPostsByTag"]
      : ["getPostsByTag", tag]) as readonly [string, string?],
  /** A single detailed post, keyed by slug (matches `usePostBySlug`). */
  detail: (slug: string) => ["getPostBySlug", slug] as const,
};
