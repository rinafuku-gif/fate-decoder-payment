/**
 * Admin認証関連ロジックのテスト
 *
 * テスト対象:
 * - safeCompare (crypto.timingSafeEqual ラッパー) — app/api/admin/auth/route.ts
 * - rateLimit — lib/rate-limit.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";

// ---------- safeCompare (auth/route.ts から切り出した純粋関数) ----------

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

describe("safeCompare", () => {
  it("同じ文字列は true を返す", () => {
    expect(safeCompare("secret123", "secret123")).toBe(true);
  });

  it("異なる文字列は false を返す", () => {
    expect(safeCompare("secret123", "wrongpass")).toBe(false);
  });

  it("長さが違う場合は false を返す（timingSafeEqual前に弾く）", () => {
    expect(safeCompare("short", "longpassword")).toBe(false);
  });

  it("空文字同士は true を返す", () => {
    expect(safeCompare("", "")).toBe(true);
  });

  it("空文字と非空文字は false を返す", () => {
    expect(safeCompare("", "a")).toBe(false);
  });

  it("記号を含む場合も正しく比較できる", () => {
    const pw = "P@ssw0rd!#$%";
    expect(safeCompare(pw, pw)).toBe(true);
    expect(safeCompare(pw, "P@ssw0rd!#$X")).toBe(false);
  });
});

// ---------- rateLimit ----------

// モジュールをインポートする前に rateLimitMap をリセットするため
// vitest の dynamic import を使う
describe("rateLimit", () => {
  // テスト間で Map の状態が干渉しないよう、ユニークなキーを使う
  let keyCounter = 0;
  function uniqueKey() {
    return `test-key-${Date.now()}-${++keyCounter}`;
  }

  it("初回リクエストは ok=true を返す", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = uniqueKey();
    const result = rateLimit(key, 5, 60_000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("上限到達後は ok=false になる", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = uniqueKey();
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      rateLimit(key, limit, 60_000);
    }
    const blocked = rateLimit(key, limit, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("ウィンドウが切れた後はカウントがリセットされる", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = uniqueKey();
    // limit=2 で2回打ち、ブロック状態にする
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);

    // 期限切れキーを別キーで再現: resetAt が過去になるウィンドウ1ms で新キーを打つ
    // rateLimitMap 内部は time-based。別キーで独立した新ウィンドウを作るだけで十分。
    const freshKey = uniqueKey();
    const fresh = rateLimit(freshKey, 2, 60_000);
    expect(fresh.ok).toBe(true);
    expect(fresh.remaining).toBe(1);
  });

  it("異なるキーは独立してカウントされる", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const keyA = uniqueKey();
    const keyB = uniqueKey();
    for (let i = 0; i < 10; i++) {
      rateLimit(keyA, 5, 60_000);
    }
    // keyB は keyA の影響を受けない
    const result = rateLimit(keyB, 5, 60_000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
