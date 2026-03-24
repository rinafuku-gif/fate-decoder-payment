import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ref, mode, name, birthDate, topic, utmSource, utmMedium, deviceType } = body;

    await db.insert(diagnoses).values({
      refId: ref || "direct",
      mode: mode || "short",
      topic: topic || null,
      userName: name || null,
      birthDate: birthDate || null,
      paidAmount: 0,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      deviceType: deviceType || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[log-diagnosis]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
