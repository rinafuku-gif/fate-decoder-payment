import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnoses, locations, kickbackPayments } from "@/drizzle/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import nodemailer from "nodemailer";
import { buildStatementHtml, generateStatementNumber, formatDateJP } from "@/lib/statement";

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

    const statementNumber = generateStatementNumber(startStr, created);
    const issuedDate = formatDateJP(new Date().toISOString().split("T")[0]);

    const statementHtml = buildStatementHtml({
      statementNumber,
      issuedDate,
      contactName: loc.contactName || "",
      locationName: loc.name,
      periodStart: startStr,
      periodEnd: endStr,
      count,
      unitRate: loc.kickbackRate,
      monthlyAmount,
      carriedOver: loc.carriedOverAmount || 0,
      totalAmount: totalWithCarry,
    });

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
