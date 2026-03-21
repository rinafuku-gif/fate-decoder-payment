import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { locations, diagnoses } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select({
    id: locations.id,
    refId: locations.refId,
    name: locations.name,
    contactName: locations.contactName,
    contactEmail: locations.contactEmail,
    bankInfo: locations.bankInfo,
    kickbackRate: locations.kickbackRate,
    isActive: locations.isActive,
    createdAt: locations.createdAt,
  }).from(locations).orderBy(locations.name);

  // Get diagnosis counts per location
  const counts = await db.select({
    refId: diagnoses.refId,
    total: sql<number>`count(*)`,
    paid: sql<number>`sum(case when ${diagnoses.paidAmount} > 0 then 1 else 0 end)`,
    revenue: sql<number>`coalesce(sum(${diagnoses.paidAmount}), 0)`,
  }).from(diagnoses).groupBy(diagnoses.refId);

  const countMap = Object.fromEntries(counts.map(c => [c.refId, c]));

  const data = rows.map(loc => ({
    ...loc,
    totalDiagnoses: countMap[loc.refId]?.total || 0,
    paidDiagnoses: countMap[loc.refId]?.paid || 0,
    revenue: countMap[loc.refId]?.revenue || 0,
    kickbackOwed: (countMap[loc.refId]?.paid || 0) * loc.kickbackRate,
  }));

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { refId, name, contactName, contactEmail, bankInfo, kickbackRate } = body;

  if (!refId || !name) {
    return NextResponse.json({ error: "refId and name are required" }, { status: 400 });
  }

  await db.insert(locations).values({
    refId,
    name,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    bankInfo: bankInfo || null,
    kickbackRate: kickbackRate || 50,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
