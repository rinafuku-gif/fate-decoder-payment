import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // 簡易認証（管理画面と同じ）
  const auth = request.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 場所別アクセス数（utm_source）
    const bySource = await db
      .select({
        utmSource: diagnoses.utmSource,
        utmMedium: diagnoses.utmMedium,
        count: sql<number>`count(*)`,
        conversions: sql<number>`sum(case when ${diagnoses.paidAmount} > 0 then 1 else 0 end)`,
      })
      .from(diagnoses)
      .where(sql`${diagnoses.utmSource} is not null`)
      .groupBy(diagnoses.utmSource, diagnoses.utmMedium)
      .orderBy(sql`count(*) desc`);

    // デバイス別集計
    const byDevice = await db
      .select({
        deviceType: diagnoses.deviceType,
        count: sql<number>`count(*)`,
      })
      .from(diagnoses)
      .where(sql`${diagnoses.deviceType} is not null`)
      .groupBy(diagnoses.deviceType);

    // 直近7日のアクセス推移（全体）
    const daily = await db
      .select({
        date: sql<string>`date(${diagnoses.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(diagnoses)
      .where(sql`${diagnoses.createdAt} >= date('now', '-7 days')`)
      .groupBy(sql`date(${diagnoses.createdAt})`)
      .orderBy(sql`date(${diagnoses.createdAt})`);

    return NextResponse.json({
      bySource,
      byDevice,
      daily,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[qr-stats]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
