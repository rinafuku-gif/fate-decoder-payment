import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses, locations, kickbackPayments } from "@/drizzle/schema";
import { sql, eq, and, gte, lt } from "drizzle-orm";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Calculate last month's period
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];
  const nextMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Get all active locations with kickback > 0
  const locs = await db.select().from(locations).where(
    and(eq(locations.isActive, true), sql`${locations.kickbackRate} > 0`)
  );

  let created = 0;

  for (const loc of locs) {
    // Count paid diagnoses for this location in the period
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
    if (count === 0) continue;

    const amount = count * loc.kickbackRate;

    // Generate statement HTML
    const statementHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 18px; border-bottom: 2px solid #c084fc; padding-bottom: 8px;">
          星の図書館 キックバック明細書
        </h1>
        <table style="width: 100%; margin: 20px 0; font-size: 14px;">
          <tr><td style="color: #666;">設置場所</td><td style="text-align: right; font-weight: bold;">${escapeHtml(loc.name)}</td></tr>
          <tr><td style="color: #666;">対象期間</td><td style="text-align: right;">${startStr} 〜 ${endStr}</td></tr>
          <tr><td style="color: #666;">有料診断件数</td><td style="text-align: right;">${count}件</td></tr>
          <tr><td style="color: #666;">単価</td><td style="text-align: right;">¥${loc.kickbackRate} / 件</td></tr>
          <tr style="border-top: 1px solid #ddd;"><td style="color: #666; padding-top: 8px;">お支払金額</td><td style="text-align: right; padding-top: 8px; font-size: 20px; font-weight: bold; color: #7c3aed;">¥${amount.toLocaleString()}</td></tr>
        </table>
        ${loc.contactName ? `<p style="font-size: 12px; color: #999;">宛先: ${escapeHtml(loc.contactName)} 様</p>` : ""}
        <p style="font-size: 11px; color: #ccc; margin-top: 40px; text-align: center;">
          発行: SATOYAMA AI BASE / 星の図書館
        </p>
      </div>
    `;

    // Upsert (delete existing + insert)
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
      amount,
      status: "pending",
      statementHtml,
      createdAt: new Date().toISOString(),
    });

    created++;
  }

  return NextResponse.json({ ok: true, created, period: `${startStr} 〜 ${endStr}` });
}
