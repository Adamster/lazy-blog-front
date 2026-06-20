/**
 * Query-key factory for a post's comment thread. Single source of truth so the
 * `useCommentsById` query and the add/update/delete mutations invalidate the
 * exact same cache entry (`["getCommentsByPostId", postId]`).
 */
export const commentsKey = (postId: string) =>
  ["getCommentsByPostId", postId] as const;
