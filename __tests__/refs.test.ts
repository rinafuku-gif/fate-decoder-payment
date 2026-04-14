/**
 * 紹介元（ref）解決ロジックのテスト
 *
 * テスト対象:
 * - getRefName — lib/refs.ts
 * - REF_MAP    — lib/refs.ts
 */

import { describe, it, expect } from "vitest";
import { getRefName, REF_MAP } from "@/lib/refs";

describe("getRefName", () => {
  it("known key を渡すと正しい日本語名が返る", () => {
    expect(getRefName("misoca")).toBe("三十日珈琲（上野原）");
    expect(getRefName("engawa")).toBe("えんがわ（梁川）");
    expect(getRefName("satoyama")).toBe("SATOYAMA AI BASE");
  });

  it("null を渡すと 'direct' のラベルが返る", () => {
    expect(getRefName(null)).toBe(REF_MAP.direct);
    expect(getRefName(null)).toBe("直接アクセス");
  });

  it("未知のキーはそのまま返る（フォールバック）", () => {
    expect(getRefName("unknown_source")).toBe("unknown_source");
  });

  it("SNS系のキーが全て解決できる", () => {
    expect(getRefName("sns_ig")).toBe("Instagram広告");
    expect(getRefName("sns_tt")).toBe("TikTok広告");
    expect(getRefName("sns_x")).toBe("X広告");
  });

  it("REF_MAP の全キーが getRefName で解決できる", () => {
    for (const [key, label] of Object.entries(REF_MAP)) {
      expect(getRefName(key)).toBe(label);
    }
  });
});

describe("REF_MAP 定義の完全性", () => {
  it("'direct' キーが存在する（Webhookのデフォルト値）", () => {
    expect(REF_MAP.direct).toBeDefined();
  });

  it("全ての値が空文字でない", () => {
    for (const value of Object.values(REF_MAP)) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
