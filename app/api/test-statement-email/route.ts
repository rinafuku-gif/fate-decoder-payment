import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildStatementText, buildStatementHtml, formatDateJP } from "@/lib/statement";

export async function GET(request: NextRequest) {
  const testKey = request.nextUrl.searchParams.get("key");
  if (testKey !== "test-html-2026-04-01") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json({ error: "GMAIL credentials not configured" }, { status: 500 });
  }

  const params = {
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
  };

  const statementText = buildStatementText(params);
  const htmlContent = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>支払明細書 ${params.statementNumber}</title></head><body>${buildStatementHtml(params)}</body></html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `星の図書館 <${user}>`,
      to: "satoyama-ai-base@tonari2tomaru.com",
      subject: "【星の図書館】テスト: 2026年3月分 お支払い完了（明細書添付版）",
      text: `テスト太郎 様\n\nいつもお世話になっております。\n星の図書館（SATOYAMA AI BASE）です。\n\n2026年3月分の紹介料のお支払いが完了しました。\n以下に支払明細書を記載いたします。\n明細書ファイルも添付しております。\n\n${statementText}\n\nご不明な点がございましたら、お気軽にご連絡ください。\n\n今後ともよろしくお願いいたします。\n\n星の図書館（SATOYAMA AI BASE）\nsatoyama-ai-base@tonari2tomaru.com`,
      attachments: [{
        filename: `支払明細書_KB-202603-TEST.html`,
        content: htmlContent,
        contentType: "text/html; charset=utf-8",
      }],
    });

    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      attached: true,
      attachmentSize: htmlContent.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
