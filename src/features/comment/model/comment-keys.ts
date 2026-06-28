// Single source of truth so the query and the add/update/delete mutations invalidate the same cache entry.
export const commentKeys = {
  byPost: (postId: string) => ["getCommentsByPostId", postId] as const,
};
