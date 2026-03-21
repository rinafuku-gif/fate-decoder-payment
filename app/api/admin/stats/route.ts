import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses, kickbackPayments } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totals] = await db.select({
    totalDiagnoses: sql<number>`count(*)`,
    paidDiagnoses: sql<number>`sum(case when ${diagnoses.paidAmount} > 0 then 1 else 0 end)`,
    totalRevenue: sql<number>`sum(${diagnoses.paidAmount})`,
  }).from(diagnoses);

  const [unpaid] = await db.select({
    unpaidKickback: sql<number>`coalesce(sum(${kickbackPayments.amount}), 0)`,
  }).from(kickbackPayments).where(sql`${kickbackPayments.status} = 'pending'`);

  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const [thisMonth] = await db.select({
    count: sql<number>`count(*)`,
    revenue: sql<number>`coalesce(sum(${diagnoses.paidAmount}), 0)`,
  }).from(diagnoses).where(sql`${diagnoses.createdAt} >= ${monthStart}`);

  // Daily counts for current month (for chart)
  const dailyCounts = await db.select({
    date: sql<string>`substr(${diagnoses.createdAt}, 1, 10)`,
    count: sql<number>`count(*)`,
  }).from(diagnoses)
    .where(sql`${diagnoses.createdAt} >= ${monthStart}`)
    .groupBy(sql`substr(${diagnoses.createdAt}, 1, 10)`)
    .orderBy(sql`substr(${diagnoses.createdAt}, 1, 10)`);

  return NextResponse.json({
    totalDiagnoses: totals.totalDiagnoses || 0,
    paidDiagnoses: totals.paidDiagnoses || 0,
    totalRevenue: totals.totalRevenue || 0,
    unpaidKickback: unpaid.unpaidKickback || 0,
    thisMonth: {
      count: thisMonth.count || 0,
      revenue: thisMonth.revenue || 0,
    },
    dailyCounts,
  });
}
