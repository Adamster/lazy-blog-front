/**
 * Typed query-key factory for the `user` resource. Single source of truth so
 * the `useUserById` query, the avatar/profile mutations, and the auth-flow
 * `setQueryData`/`removeQueries` calls all hit the same cache entry
 * (`["getUserById", userId]`). Omit `userId` to match every user (used to clear
 * all user caches on logout).
 */
export const userKeys = {
  byId: (userId?: string) =>
    (userId === undefined
      ? ["getUserById"]
      : ["getUserById", userId]) as readonly [string, string?],
};
