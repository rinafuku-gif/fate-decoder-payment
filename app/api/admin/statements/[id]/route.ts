import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { kickbackPayments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return new NextResponse("Invalid ID", { status: 400 });
  }
  const [payment] = await db.select().from(kickbackPayments)
    .where(eq(kickbackPayments.id, numericId));

  if (!payment || !payment.statementHtml) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>明細書</title></head><body>${payment.statementHtml}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
