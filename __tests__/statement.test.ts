/**
 * 支払明細書生成ロジックのテスト
 *
 * テスト対象:
 * - generateStatementNumber — lib/statement.ts
 * - formatDateJP           — lib/statement.ts
 * - buildStatementText     — lib/statement.ts
 * - buildStatementHtml     — lib/statement.ts (XSS対策を含む)
 */

import { describe, it, expect } from "vitest";
import {
  generateStatementNumber,
  formatDateJP,
  buildStatementText,
  buildStatementHtml,
} from "@/lib/statement";

// ---------- 共通テストデータ ----------

const BASE_PARAMS = {
  statementNumber: "KB-202504-001",
  issuedDate: "2025-04-30",
  contactName: "山田太郎",
  locationName: "三十日珈琲（上野原）",
  periodStart: "2025-04-01",
  periodEnd: "2025-04-30",
  count: 10,
  unitRate: 50,
  monthlyAmount: 500,
  carriedOver: 0,
  totalAmount: 500,
};

// ---------- generateStatementNumber ----------

describe("generateStatementNumber", () => {
  it("periodStart から年月6桁+連番3桁の形式を生成する", () => {
    expect(generateStatementNumber("2025-04-01", 0)).toBe("KB-202504-001");
  });

  it("index が 0 → 001、9 → 010 になる", () => {
    expect(generateStatementNumber("2025-04-01", 0)).toBe("KB-202504-001");
    expect(generateStatementNumber("2025-04-01", 9)).toBe("KB-202504-010");
  });

  it("月をまたいだ場合に年月部分が正しく変わる", () => {
    expect(generateStatementNumber("2026-01-01", 0)).toBe("KB-202601-001");
    expect(generateStatementNumber("2025-12-01", 2)).toBe("KB-202512-003");
  });
});

// ---------- formatDateJP ----------

describe("formatDateJP", () => {
  it("ISO文字列を日本語形式に変換する", () => {
    expect(formatDateJP("2025-04-01")).toBe("2025年4月1日");
  });

  it("月が2桁でも正しく変換される", () => {
    expect(formatDateJP("2025-11-30")).toBe("2025年11月30日");
  });

  it("1月は '1月' になる（ゼロパディングなし）", () => {
    expect(formatDateJP("2025-01-15")).toBe("2025年1月15日");
  });
});

// ---------- buildStatementText ----------

describe("buildStatementText", () => {
  it("基本フォーマットに必要な情報が全て含まれる", () => {
    const text = buildStatementText(BASE_PARAMS);
    expect(text).toContain("支払明細書");
    expect(text).toContain("KB-202504-001");
    expect(text).toContain("山田太郎 様");
    expect(text).toContain("三十日珈琲（上野原）");
    expect(text).toContain("10件");
    expect(text).toContain("¥500");
  });

  it("carriedOver=0 のとき「前月繰越」行が含まれない", () => {
    const text = buildStatementText({ ...BASE_PARAMS, carriedOver: 0 });
    expect(text).not.toContain("前月繰越");
  });

  it("carriedOver>0 のとき「前月繰越」行が含まれる", () => {
    const text = buildStatementText({
      ...BASE_PARAMS,
      carriedOver: 200,
      totalAmount: 700,
    });
    expect(text).toContain("前月繰越");
    expect(text).toContain("¥200");
    expect(text).toContain("¥700");
  });

  it("contactName が空の場合は locationName で宛名が表示される", () => {
    const text = buildStatementText({ ...BASE_PARAMS, contactName: "" });
    expect(text).toContain("三十日珈琲（上野原） 様");
  });

  it("金額が3桁区切りで表示される", () => {
    const text = buildStatementText({ ...BASE_PARAMS, monthlyAmount: 12000, totalAmount: 12000 });
    expect(text).toContain("12,000");
  });
});

// ---------- buildStatementHtml (XSS対策) ----------

describe("buildStatementHtml — XSS対策", () => {
  it("contactName に HTML特殊文字が含まれてもエスケープされる", () => {
    const html = buildStatementHtml({
      ...BASE_PARAMS,
      contactName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("locationName の & がエスケープされる", () => {
    const html = buildStatementHtml({
      ...BASE_PARAMS,
      locationName: "Foo & Bar",
    });
    expect(html).not.toMatch(/[^&]& [^a]/);
    expect(html).toContain("Foo &amp; Bar");
  });

  it("statementNumber の <> がエスケープされる", () => {
    const html = buildStatementHtml({
      ...BASE_PARAMS,
      statementNumber: "KB<2025>001",
    });
    expect(html).toContain("KB&lt;2025&gt;001");
  });

  it("carriedOver>0 のとき繰越行が HTML に含まれる", () => {
    const html = buildStatementHtml({
      ...BASE_PARAMS,
      carriedOver: 300,
      totalAmount: 800,
    });
    expect(html).toContain("前月繰越");
  });

  it("carriedOver=0 のとき繰越行が HTML に含まれない", () => {
    const html = buildStatementHtml({ ...BASE_PARAMS, carriedOver: 0 });
    expect(html).not.toContain("前月繰越");
  });
});

// ---------- 料金集計ロジック ----------

describe("料金集計: totalAmount の計算", () => {
  it("当月分のみ: monthlyAmount == totalAmount のときテキストが一致する", () => {
    const text = buildStatementText({
      ...BASE_PARAMS,
      monthlyAmount: 500,
      carriedOver: 0,
      totalAmount: 500,
    });
    expect(text).toContain("¥500");
  });

  it("繰越あり: monthlyAmount + carriedOver == totalAmount", () => {
    const monthly = 500;
    const carried = 200;
    const total = monthly + carried;
    const text = buildStatementText({
      ...BASE_PARAMS,
      monthlyAmount: monthly,
      carriedOver: carried,
      totalAmount: total,
    });
    expect(text).toContain(`¥${total.toLocaleString()}`);
  });

  it("kickbackRate 50% × count 10 = ¥500 の数値整合性", () => {
    // スキーマの kickbackRate はデフォルト50（円/件）
    const count = 10;
    const unitRate = 50;
    const expected = count * unitRate;
    expect(expected).toBe(500);

    const text = buildStatementText({
      ...BASE_PARAMS,
      count,
      unitRate,
      monthlyAmount: expected,
      totalAmount: expected,
    });
    expect(text).toContain("10件");
    expect(text).toContain("¥500");
  });
});
