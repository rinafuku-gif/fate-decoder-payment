import crypto from "crypto";

interface TokenRecord {
  token: string;
  sessionId: string;
  createdAt: number;
  used: boolean;
}

// In-memory token store (MVP). For production, replace with Vercel KV.
const tokenStore = new Map<string, TokenRecord>();

const TTL_MS = 60 * 60 * 1000; // 1 hour

export function createToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  tokenStore.set(token, {
    token,
    sessionId,
    createdAt: Date.now(),
    used: false,
  });
  // Cleanup old tokens opportunistically
  cleanupExpired();
  return token;
}

export function verifyAndConsumeToken(token: string): {
  valid: boolean;
  sessionId?: string;
  error?: string;
} {
  const record = tokenStore.get(token);
  if (!record) return { valid: false, error: "Token not found" };
  if (record.used) return { valid: false, error: "Token already used" };
  if (Date.now() - record.createdAt > TTL_MS) {
    tokenStore.delete(token);
    return { valid: false, error: "Token expired" };
  }
  record.used = true;
  tokenStore.set(token, record);
  return { valid: true, sessionId: record.sessionId };
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of tokenStore.entries()) {
    if (now - record.createdAt > TTL_MS) {
      tokenStore.delete(key);
    }
  }
}
