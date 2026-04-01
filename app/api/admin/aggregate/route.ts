import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses, locations, kickbackPayments } from "@/drizzle/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { buildStatementHtml, generateStatementNumber, formatDateJP } from "@/lib/statement";

const MINIMUM_PAYOUT = 10000; // 1万円未満は繰り越し

export async function POST() {
  if (!(await isAdminAuthenticated())) {
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
      // 1万円未満: 繰り越し
      await db.update(locations).set({
        carriedOverAmount: totalWithCarry,
      }).where(eq(locations.id, loc.id));
      carriedOver++;
      continue;
    }

    // 1万円以上: 支払い対象
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
      and(
        eq(kickbackPayments.locationRef, loc.refId),
        eq(kickbackPayments.periodStart, startStr),
      )
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

    // 繰り越し額をリセット
    await db.update(locations).set({
      carriedOverAmount: 0,
    }).where(eq(locations.id, loc.id));

    created++;
  }

  return NextResponse.json({
    ok: true,
    created,
    carriedOver,
    period: `${startStr} 〜 ${endStr}`,
  });
}
