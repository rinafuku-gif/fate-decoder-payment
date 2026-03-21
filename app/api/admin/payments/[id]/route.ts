import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { kickbackPayments } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.status === "paid") {
    await db.update(kickbackPayments)
      .set({ status: "paid", paidAt: new Date().toISOString() })
      .where(eq(kickbackPayments.id, parseInt(id)));
  }

  return NextResponse.json({ ok: true });
}
