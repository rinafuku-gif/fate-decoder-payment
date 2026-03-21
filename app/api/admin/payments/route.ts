import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { kickbackPayments } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(kickbackPayments).orderBy(desc(kickbackPayments.createdAt));
  return NextResponse.json(rows);
}
