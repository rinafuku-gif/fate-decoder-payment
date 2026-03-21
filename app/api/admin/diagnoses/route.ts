import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";
import { sql } from "drizzle-orm";

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

  const conditions: string[] = [];
  if (refId) conditions.push(`ref_id = '${refId}'`);
  if (mode) conditions.push(`mode = '${mode}'`);
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.all(sql.raw(
    `SELECT * FROM diagnoses ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
  ));

  const [{ total }] = await db.all<{ total: number }>(sql.raw(
    `SELECT count(*) as total FROM diagnoses ${where}`
  ));

  return NextResponse.json({
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil((total || 0) / limit),
  });
}
