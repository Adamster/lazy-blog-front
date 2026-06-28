// Client hooks AND the SSR `setQueryData` seeds route through this, so the seed
// lands on the exact key the client hook reads (else hydration silently misses).
export const postKeys = {
  // `list()` is the canonical alias.
  all: () => ["getAllPosts"] as const,
  list: () => ["getAllPosts"] as const,
  // Omit `userName` to match every user feed (broad invalidation).
  byUser: (userName?: string) =>
    (userName === undefined
      ? ["getPostsByUserName"]
      : ["getPostsByUserName", userName]) as readonly [string, string?],
  // Omit `tag` to match every tag feed (broad invalidation).
  byTag: (tag?: string) =>
    (tag === undefined
      ? ["getPostsByTag"]
      : ["getPostsByTag", tag]) as readonly [string, string?],
  detail: (slug: string) => ["getPostBySlug", slug] as const,
  ratingHistory: (slug: string) => ["getPostRatingHistory", slug] as const,
  homeStats: () => ["getHomeStats"] as const,
};
