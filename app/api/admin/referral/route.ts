import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { referralFees } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

function verifyBearer(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace("Bearer ", "");
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function GET(request: NextRequest) {
  if (!verifyBearer(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 場所ごとの集計
    const byPlace = await db
      .select({
        placeId: referralFees.placeId,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${referralFees.amount})`,
        totalFee: sql<number>`sum(${referralFees.fee})`,
        unpaidFee: sql<number>`sum(case when ${referralFees.status} = 'unpaid' then ${referralFees.fee} else 0 end)`,
        paidFee: sql<number>`sum(case when ${referralFees.status} = 'paid' then ${referralFees.fee} else 0 end)`,
      })
      .from(referralFees)
      .groupBy(referralFees.placeId)
      .orderBy(sql`count(*) desc`);

    // 月別推移
    const monthly = await db
      .select({
        month: sql<string>`strftime('%Y-%m', ${referralFees.createdAt})`,
        count: sql<number>`count(*)`,
        totalFee: sql<number>`sum(${referralFees.fee})`,
      })
      .from(referralFees)
      .groupBy(sql`strftime('%Y-%m', ${referralFees.createdAt})`)
      .orderBy(sql`strftime('%Y-%m', ${referralFees.createdAt}) desc`);

    // 未払い一覧
    const unpaid = await db
      .select()
      .from(referralFees)
      .where(eq(referralFees.status, "unpaid"))
      .orderBy(sql`${referralFees.createdAt} desc`);

    return NextResponse.json({
      byPlace,
      monthly,
      unpaid,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[referral]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// 支払済みに更新
export async function PATCH(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body as { ids: number[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    for (const id of ids) {
      await db
        .update(referralFees)
        .set({ status: "paid", paidAt: now })
        .where(eq(referralFees.id, id));
    }

    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (err) {
    console.error("[referral PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
