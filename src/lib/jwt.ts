/**
 * Decode a JWT payload WITHOUT verifying the signature.
 *
 * The server already verified the token when it issued it. The
 * client only uses this to read non-sensitive claims for UI
 * purposes (id, role, tier). Never trust these values for
 * authorization — the backend re-checks on every request.
 */

export interface JwtClaims {
  sub: string;          // user id
  iat: number;          // issued-at (seconds)
  exp: number;          // expiry (seconds)
  type?: string;        // "access" | "refresh"
  tier?: string;
  role?: string;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): string {
  // Pad to a multiple of 4 characters
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  try {
    // atob returns a "binary string" (each char is a byte).
    // For ASCII JWT payloads (JSON), this is fine.
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(""),
    );
  } catch {
    // Fallback for plain ASCII payloads
    return atob(base64);
  }
}

export function decodeJwt(token: string): JwtClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = parts[1];
  if (!payload) return null;
  try {
    const json = base64UrlDecode(payload);
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: JwtClaims | null, skewSeconds = 5): boolean {
  if (!claims || typeof claims.exp !== "number") return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return claims.exp <= nowSec + skewSeconds;
}