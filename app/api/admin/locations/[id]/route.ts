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
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    return NextResponse.json({ error: "無効なIDです" }, { status: 400 });
  }
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  const fields = ["status", "isActive", "kickbackRate", "bankInfo", "name", "contactName", "contactEmail", "address", "postalCode", "prefecture", "city", "streetAddress", "bankName", "branchName", "accountType", "accountNumber", "accountHolder"];
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }

  if (body.status === "approved") {
    updates.isActive = true;
  }

  await db.update(locations).set(updates).where(eq(locations.id, numericId));

  return NextResponse.json({ ok: true });
}
