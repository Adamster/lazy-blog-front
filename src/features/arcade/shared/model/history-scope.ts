/**
 * Identity scope for the arcade's localStorage run logs: the signed-in
 * username, or the shared guest bucket. Keying every log per identity keeps
 * logout / another login on the same device from inheriting someone else's
 * local stats (BEST + the last-20 sparkline).
 */
export const GUEST_SCOPE = "anon";

export function identityScope(userName?: string): string {
  return userName || GUEST_SCOPE;
}
