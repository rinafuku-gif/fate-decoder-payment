import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildStatementText, buildStatementHtml, formatDateJP } from "@/lib/statement";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("key") !== "test-color-fix") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return NextResponse.json({ error: "No Gmail" }, { status: 500 });

  const p = {
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
  const text = buildStatementText(p);
  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>支払明細書</title></head><body>${buildStatementHtml(p)}</body></html>`;

  try {
    const t = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    const info = await t.sendMail({
      from: `星の図書館 <${user}>`,
      to: "satoyama-ai-base@tonari2tomaru.com",
      subject: "【星の図書館】テスト: 明細書 文字色修正版",
      text: `テスト太郎 様\n\nいつもお世話になっております。\n星の図書館（SATOYAMA AI BASE）です。\n\n明細書の文字色を修正しました。\n添付ファイルをご確認ください。\n\n${text}\n\n星の図書館（SATOYAMA AI BASE）\nsatoyama-ai-base@tonari2tomaru.com`,
      attachments: [{ filename: "支払明細書_KB-202603-TEST.html", content: html, contentType: "text/html; charset=utf-8" }],
    });
    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
