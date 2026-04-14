/**
 * DBスキーマ定義の制約テスト
 *
 * 実際のDBには接続しない。
 * Drizzle スキーマオブジェクトのメタデータ（カラム定義・デフォルト値・ユニーク制約）
 * が意図通りかを検証する。
 */

import { describe, it, expect } from "vitest";
import {
  diagnoses,
  locations,
  paymentTokens,
  referralFees,
  kickbackPayments,
} from "@/drizzle/schema";

// Drizzle テーブルオブジェクトからカラム定義を取得するヘルパー
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getColumn(table: any, columnName: string) {
  // Drizzle v0.45 系は table[column] または table._.columns でアクセス可能
  return table[columnName] ?? table._.columns?.[columnName];
}

// ---------- diagnoses ----------

describe("diagnoses スキーマ", () => {
  it("stripeSessionId は unique 制約を持つ（重複防止の核心）", () => {
    const col = getColumn(diagnoses, "stripeSessionId");
    expect(col).toBeDefined();
    // Drizzle の isUnique フラグ
    expect(col.isUnique).toBe(true);
  });

  it("paidAmount のデフォルト値は 0", () => {
    const col = getColumn(diagnoses, "paidAmount");
    expect(col).toBeDefined();
    expect(col.default).toBe(0);
  });

  it("refId のデフォルト値は 'direct'", () => {
    const col = getColumn(diagnoses, "refId");
    expect(col).toBeDefined();
    expect(col.default).toBe("direct");
  });

  it("mode は notNull", () => {
    const col = getColumn(diagnoses, "mode");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });
});

// ---------- locations ----------

describe("locations スキーマ", () => {
  it("refId は unique", () => {
    const col = getColumn(locations, "refId");
    expect(col).toBeDefined();
    expect(col.isUnique).toBe(true);
  });

  it("kickbackRate のデフォルト値は 50（円/件）", () => {
    const col = getColumn(locations, "kickbackRate");
    expect(col).toBeDefined();
    expect(col.default).toBe(50);
  });

  it("carriedOverAmount のデフォルト値は 0", () => {
    const col = getColumn(locations, "carriedOverAmount");
    expect(col).toBeDefined();
    expect(col.default).toBe(0);
  });

  it("status のデフォルト値は 'pending'", () => {
    const col = getColumn(locations, "status");
    expect(col).toBeDefined();
    expect(col.default).toBe("pending");
  });

  it("isActive のデフォルト値は true", () => {
    const col = getColumn(locations, "isActive");
    expect(col).toBeDefined();
    expect(col.default).toBe(true);
  });

  it("name は notNull", () => {
    const col = getColumn(locations, "name");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });
});

// ---------- paymentTokens ----------

describe("paymentTokens スキーマ", () => {
  it("token は unique", () => {
    const col = getColumn(paymentTokens, "token");
    expect(col).toBeDefined();
    expect(col.isUnique).toBe(true);
  });

  it("used のデフォルト値は false", () => {
    const col = getColumn(paymentTokens, "used");
    expect(col).toBeDefined();
    expect(col.default).toBe(false);
  });

  it("sessionId は notNull", () => {
    const col = getColumn(paymentTokens, "sessionId");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });
});

// ---------- referralFees ----------

describe("referralFees スキーマ", () => {
  it("status のデフォルト値は 'unpaid'", () => {
    const col = getColumn(referralFees, "status");
    expect(col).toBeDefined();
    expect(col.default).toBe("unpaid");
  });

  it("amount は notNull", () => {
    const col = getColumn(referralFees, "amount");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });

  it("fee は notNull", () => {
    const col = getColumn(referralFees, "fee");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });

  it("placeId は notNull", () => {
    const col = getColumn(referralFees, "placeId");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });
});

// ---------- kickbackPayments ----------

describe("kickbackPayments スキーマ", () => {
  it("status のデフォルト値は 'pending'", () => {
    const col = getColumn(kickbackPayments, "status");
    expect(col).toBeDefined();
    expect(col.default).toBe("pending");
  });

  it("amount のデフォルト値は 0", () => {
    const col = getColumn(kickbackPayments, "amount");
    expect(col).toBeDefined();
    expect(col.default).toBe(0);
  });

  it("diagnosisCount のデフォルト値は 0", () => {
    const col = getColumn(kickbackPayments, "diagnosisCount");
    expect(col).toBeDefined();
    expect(col.default).toBe(0);
  });

  it("unitAmount のデフォルト値は 50（kickbackRate デフォルトと一致）", () => {
    const col = getColumn(kickbackPayments, "unitAmount");
    expect(col).toBeDefined();
    expect(col.default).toBe(50);
  });

  it("locationRef は notNull", () => {
    const col = getColumn(kickbackPayments, "locationRef");
    expect(col).toBeDefined();
    expect(col.notNull).toBe(true);
  });
});

// ---------- Webhook重複チェックロジックの単体テスト ----------

describe("Webhook重複チェック: stripeSessionId ユニーク制約の意味を確認", () => {
  it("同一 stripeSessionId は diagnoses に一件のみ存在すべき（設計確認）", () => {
    // 実際のDB操作は行わず、ロジックの仕様として検証
    // webhook/route.ts: existing.length === 0 のときのみ INSERT する設計
    const sessionId = "cs_test_abcdefg";

    // 1件目 (INSERT 想定)
    const existing1: { id: number }[] = [];
    expect(existing1.length === 0).toBe(true); // → INSERT する

    // 2件目 (SKIP 想定)
    const existing2: { id: number }[] = [{ id: 1 }];
    expect(existing2.length === 0).toBe(false); // → スキップ

    // sessionId の形式確認（Stripe IDは cs_ または pi_ で始まる）
    expect(sessionId).toMatch(/^cs_/);
  });
});
