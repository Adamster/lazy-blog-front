// Omit `userId` to match every user (used to clear all user caches on logout).
export const userKeys = {
  byId: (userId?: string) =>
    (userId === undefined
      ? ["getUserById"]
      : ["getUserById", userId]) as readonly [string, string?],
};
