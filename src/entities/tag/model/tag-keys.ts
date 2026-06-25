/**
 * Typed query-key factory for the `tag` resource. Single source of truth so the
 * `useTags` query routes through the same key the rest of the app would use to
 * invalidate it.
 */
export const tagKeys = {
  all: () => ["getTags"] as const,
};
