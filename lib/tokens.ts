import crypto from "crypto";
import { db } from "@/lib/db";
import { paymentTokens } from "@/drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(paymentTokens).values({
    token,
    sessionId,
    createdAt: new Date().toISOString(),
    used: false,
  });
  // Cleanup old tokens opportunistically
  await cleanupExpired();
  return token;
}

export async function verifyAndConsumeToken(token: string): Promise<{
  valid: boolean;
  sessionId?: string;
  error?: string;
}> {
  const records = await db
    .select()
    .from(paymentTokens)
    .where(eq(paymentTokens.token, token))
    .limit(1);

  const record = records[0];
  if (!record) return { valid: false, error: "Token not found" };
  if (record.used) return { valid: false, error: "Token already used" };

  const createdAt = new Date(record.createdAt).getTime();
  if (Date.now() - createdAt > TTL_MS) {
    await db.delete(paymentTokens).where(eq(paymentTokens.id, record.id));
    return { valid: false, error: "Token expired" };
  }

  await db
    .update(paymentTokens)
    .set({ used: true })
    .where(eq(paymentTokens.id, record.id));

  return { valid: true, sessionId: record.sessionId };
}

async function cleanupExpired() {
  const cutoff = new Date(Date.now() - TTL_MS).toISOString();
  await db.delete(paymentTokens).where(lt(paymentTokens.createdAt, cutoff));
}
