import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildStatementText, formatDateJP } from "@/lib/statement";

export async function GET(request: NextRequest) {
  // One-time test - restricted by unique URL parameter
  const testKey = request.nextUrl.searchParams.get("key");
  if (testKey !== "test-statement-2026-04-01") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json({ error: "GMAIL credentials not configured" }, { status: 500 });
  }

  const statementText = buildStatementText({
    statementNumber: "KB-202603-TEST",
    issuedDate: formatDateJP("2026-04-01"),
    contactName: "テスト太郎",
    locationName: "テストカフェ",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    count: 250,
    unitRate: 50,
    monthlyAmount: 12500,
    carriedOver: 3000,
    totalAmount: 15500,
  });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `星の図書館 <${user}>`,
      to: "satoyama-ai-base@tonari2tomaru.com",
      subject: "【星の図書館】テスト: 2026年3月分 お支払い完了のご報告",
      text: `テスト太郎 様

いつもお世話になっております。
星の図書館です。

2026年3月分の紹介料のお支払いが完了しました。
以下に支払明細書を記載いたします。

${statementText}

ご不明な点がございましたら、お気軽にご連絡ください。

今後ともよろしくお願いいたします。

星の図書館
SATOYAMA AI BASE
r.inafuku@tonari2tomaru.com`,
    });

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
