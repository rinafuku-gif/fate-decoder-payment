import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";
import { sql, gte, lt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period") || "all";
  const now = new Date();
  let startDate = "";

  if (period === "month") {
    startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  } else if (period === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    startDate = lm.toISOString().split("T")[0];
  }

  const endDate = period === "last_month"
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    : "";

  // Build where conditions
  const conditions = [];
  if (startDate) conditions.push(gte(diagnoses.createdAt, startDate));
  if (endDate) conditions.push(lt(diagnoses.createdAt, endDate));

  const whereClause = conditions.length > 0
    ? sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`).reduce((a, b) => sql`${a}${b}`)}`
    : sql`1=1`;

  // Source-level aggregation
  const sourceStats = await db.select({
    source: sql<string>`coalesce(${diagnoses.utmSource}, 'direct')`,
    medium: sql<string>`coalesce(${diagnoses.utmMedium}, '')`,
    total: sql<number>`count(*)`,
    paid: sql<number>`sum(case when ${diagnoses.paidAmount} > 0 then 1 else 0 end)`,
    revenue: sql<number>`coalesce(sum(${diagnoses.paidAmount}), 0)`,
  }).from(diagnoses).where(whereClause).groupBy(
    sql`coalesce(${diagnoses.utmSource}, 'direct')`,
    sql`coalesce(${diagnoses.utmMedium}, '')`
  ).orderBy(sql`count(*) desc`);

  // Overall totals
  const [totals] = await db.select({
    total: sql<number>`count(*)`,
    paid: sql<number>`sum(case when ${diagnoses.paidAmount} > 0 then 1 else 0 end)`,
    revenue: sql<number>`coalesce(sum(${diagnoses.paidAmount}), 0)`,
  }).from(diagnoses).where(whereClause);

  // Classify sources
  const referralPrefixes = ["partner-"];
  const channels = sourceStats.map((s) => {
    const isReferral = referralPrefixes.some((p) => String(s.source).startsWith(p));
    const category = isReferral ? "referral" : (s.source === "direct" && !s.medium) ? "organic" : "own";
    return {
      source: s.source,
      medium: s.medium,
      category,
      total: s.total || 0,
      paid: s.paid || 0,
      revenue: s.revenue || 0,
      conversionRate: s.total > 0 ? Math.round(((s.paid || 0) / s.total) * 1000) / 10 : 0,
    };
  });

  return NextResponse.json({
    period,
    totals: {
      total: totals.total || 0,
      paid: totals.paid || 0,
      revenue: totals.revenue || 0,
      conversionRate: totals.total > 0 ? Math.round(((totals.paid || 0) / totals.total) * 1000) / 10 : 0,
    },
    channels,
  });
}
