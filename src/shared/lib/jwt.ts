/**
 * Decode a JWT's `exp` into epoch MS, for refresh SCHEDULING ONLY — NO signature
 * verification. Never use for a trust/authorization decision: a tampered `exp`
 * can only make the client refresh early/late, never grant access (backend 401s
 * a forged/expired token). Returns `null` on malformed input (caller uses TTL).
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

const base64UrlDecode = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "="
  );
  return atob(padded);
};
