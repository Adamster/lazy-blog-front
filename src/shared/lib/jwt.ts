/**
 * Decode the `exp` claim of a JWT into epoch MILLISECONDS, for SCHEDULING ONLY.
 *
 * IMPORTANT — this performs NO signature verification and trusts nothing about
 * the token's integrity. Its sole job is to read the access token's real expiry
 * so the client can schedule a proactive refresh against the server-issued `exp`
 * (anchored to the SERVER clock baked into the token) instead of guessing
 * `now + 30min` with the local clock at receipt. The backend remains the only
 * authority on whether a token is actually valid (it 401s a forged/expired one);
 * a tampered `exp` here can only make the client refresh too early or too late,
 * never grant access. Never use this to make a trust/authorization decision.
 *
 * Returns `exp * 1000` (ms) on success, or `null` for any malformed input so the
 * caller can fall back to the TTL constant.
 */
export const decodeJwtExp = (token: string): number | null => {
  const segments = token.split(".");
  if (segments.length !== 3) return null;

  try {
    const payload = base64UrlDecode(segments[1]);
    const claims = JSON.parse(payload) as { exp?: unknown };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
};

/** base64url → UTF-8 string. Restores padding + the standard `+/` alphabet. */
const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  // `atob` exists in the browser and in modern Node (the only runtimes that hit
  // this — tokens are only decoded client-side after a login/refresh).
  return atob(padded);
};
