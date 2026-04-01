import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnoses, locations, kickbackPayments } from "@/drizzle/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import nodemailer from "nodemailer";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const MINIMUM_PAYOUT = 10000;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];
  const nextMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const locs = await db.select().from(locations).where(
    and(eq(locations.isActive, true), sql`${locations.kickbackRate} > 0`)
  );

  let created = 0;
  let carriedOver = 0;

  for (const loc of locs) {
    const [result] = await db.select({
      count: sql<number>`count(*)`,
    }).from(diagnoses).where(
      and(
        eq(diagnoses.refId, loc.refId),
        sql`${diagnoses.paidAmount} > 0`,
        gte(diagnoses.createdAt, startStr),
        lt(diagnoses.createdAt, nextMonthStr),
      )
    );

    const count = result.count || 0;
    const monthlyAmount = count * loc.kickbackRate;
    const totalWithCarry = monthlyAmount + (loc.carriedOverAmount || 0);

    if (count === 0 && (loc.carriedOverAmount || 0) === 0) continue;

    if (totalWithCarry < MINIMUM_PAYOUT) {
      await db.update(locations).set({
        carriedOverAmount: totalWithCarry,
      }).where(eq(locations.id, loc.id));
      carriedOver++;
      continue;
    }

    const carryStr = (loc.carriedOverAmount || 0) > 0
      ? `<tr><td style="color: #666;">前月繰越</td><td style="text-align: right;">¥${(loc.carriedOverAmount || 0).toLocaleString()}</td></tr>`
      : "";

    const statementHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 18px; border-bottom: 2px solid #c084fc; padding-bottom: 8px;">星の図書館 キックバック明細書</h1>
        <table style="width: 100%; margin: 20px 0; font-size: 14px;">
          <tr><td style="color: #666;">設置場所</td><td style="text-align: right; font-weight: bold;">${escapeHtml(loc.name)}</td></tr>
          <tr><td style="color: #666;">対象期間</td><td style="text-align: right;">${startStr} 〜 ${endStr}</td></tr>
          <tr><td style="color: #666;">有料診断件数</td><td style="text-align: right;">${count}件</td></tr>
          <tr><td style="color: #666;">単価</td><td style="text-align: right;">¥${loc.kickbackRate} / 件</td></tr>
          <tr><td style="color: #666;">当月分</td><td style="text-align: right;">¥${monthlyAmount.toLocaleString()}</td></tr>
          ${carryStr}
          <tr style="border-top: 1px solid #ddd;"><td style="color: #666; padding-top: 8px;">お支払金額</td><td style="text-align: right; padding-top: 8px; font-size: 20px; font-weight: bold; color: #7c3aed;">¥${totalWithCarry.toLocaleString()}</td></tr>
        </table>
        ${loc.contactName ? `<p style="font-size: 12px; color: #999;">宛先: ${escapeHtml(loc.contactName)} 様</p>` : ""}
        <p style="font-size: 11px; color: #ccc; margin-top: 40px; text-align: center;">発行: SATOYAMA AI BASE / 星の図書館</p>
      </div>
    `;

    await db.delete(kickbackPayments).where(
      and(eq(kickbackPayments.locationRef, loc.refId), eq(kickbackPayments.periodStart, startStr))
    );

    await db.insert(kickbackPayments).values({
      locationRef: loc.refId,
      periodStart: startStr,
      periodEnd: endStr,
      diagnosisCount: count,
      unitAmount: loc.kickbackRate,
      amount: totalWithCarry,
      status: "pending",
      statementHtml,
      createdAt: new Date().toISOString(),
    });

    await db.update(locations).set({ carriedOverAmount: 0 }).where(eq(locations.id, loc.id));
    created++;
  }

  // Notify admin
  try {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (user && pass) {
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
      await transporter.sendMail({
        from: `星の図書館 <${user}>`,
        to: user,
        subject: `【星の図書館】${startStr}〜${endStr} キックバック月次集計完了`,
        text: `月次集計が完了しました。\n\n支払対象: ${created}件\n繰り越し: ${carriedOver}件\n期間: ${startStr} 〜 ${endStr}\n\n管理画面で確認してください。`,
      });
    }
  } catch (err) {
    console.error("Failed to send aggregate notification:", err);
  }

  return NextResponse.json({ ok: true, created, carriedOver, period: `${startStr} 〜 ${endStr}` });
}
