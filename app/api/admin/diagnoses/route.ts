import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";
import { sql, desc, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const refId = searchParams.get("ref");
  const mode = searchParams.get("mode");
  const offset = (page - 1) * limit;

  const conditions = [];
  if (refId) conditions.push(eq(diagnoses.refId, refId));
  if (mode) conditions.push(eq(diagnoses.mode, mode));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db.select().from(diagnoses)
    .where(whereClause)
    .orderBy(desc(diagnoses.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db.select({
    total: sql<number>`count(*)`,
  }).from(diagnoses).where(whereClause);

  const total = countResult?.total || 0;

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
