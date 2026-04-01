import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { locations } from "@/drizzle/schema";
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

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.isActive !== undefined) updates.isActive = body.isActive;
  if (body.kickbackRate !== undefined) updates.kickbackRate = body.kickbackRate;
  if (body.bankInfo !== undefined) updates.bankInfo = body.bankInfo;

  if (body.status === "approved") {
    updates.isActive = true;
  }

  await db.update(locations).set(updates).where(eq(locations.id, parseInt(id)));

  return NextResponse.json({ ok: true });
}
