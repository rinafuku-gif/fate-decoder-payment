import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { locations } from "@/drizzle/schema";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`partner:${ip}`, 5, 60 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "申し込みが多すぎます。しばらくお待ちください" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, contactName, contactEmail, address, kickbackRate, bankName, branchName, accountType, accountNumber, accountHolder } = body;

    if (!name || !contactName || !contactEmail || !bankName || !branchName || !accountType || !accountNumber || !accountHolder) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const refId = `partner-${crypto.randomBytes(6).toString("hex")}`;

    await db.insert(locations).values({
      refId,
      name,
      contactName,
      contactEmail,
      address: address || null,
      bankInfo: `${bankName} ${branchName} ${accountType} ${accountNumber} ${accountHolder}`,
      bankName,
      branchName,
      accountType,
      accountNumber,
      accountHolder,
      kickbackRate: kickbackRate || 50,
      status: "pending",
      isActive: false,
    });

    // Send admin notification email (if GAS webhook configured)
    const gasUrl = process.env.GAS_WEBHOOK_URL;
    if (gasUrl) {
      fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "partner_application",
          subject: `【星の図書館】新しい掲示パートナー申し込み - ${name}`,
          body: `場所名: ${name}\n担当者: ${contactName}\nメール: ${contactEmail}\n住所: ${address || "未入力"}\n\n【振込先】\n金融機関: ${bankName}\n支店: ${branchName}\n種別: ${accountType}\n口座番号: ${accountNumber}\n名義: ${accountHolder}`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: "お申し込みを受け付けました。確認後ご連絡いたします。" });
  } catch (error) {
    console.error("Partner application error:", error);
    return NextResponse.json({ error: "エラーが発生しました" }, { status: 500 });
  }
}
