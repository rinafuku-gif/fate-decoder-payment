import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";
import { rateLimit } from "@/lib/rate-limit";

const VALID_MODES = ["short", "full", "compatibility"] as const;
const VALID_TOPICS = ["general", "work", "love", "social", "money"] as const;
const BIRTH_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isString(v: unknown): v is string {
  return typeof v === "string";
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`log-diagnosis:${ip}`, 30, 60 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらくお待ちください" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { ref, mode, name, birthDate, topic, utmSource, utmMedium, utmCampaign, deviceType } = body;

    // mode は必須かつ許可値のみ
    if (!isString(mode) || !(VALID_MODES as readonly string[]).includes(mode)) {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    // topic は任意だが指定する場合は許可値のみ
    if (topic !== undefined && topic !== null && (!isString(topic) || !(VALID_TOPICS as readonly string[]).includes(topic))) {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    // name: 文字列かつ100文字以内
    if (name !== undefined && name !== null && (!isString(name) || name.length > 100)) {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    // birthDate: YYYY-MM-DD 形式
    if (birthDate !== undefined && birthDate !== null && (!isString(birthDate) || !BIRTH_DATE_RE.test(birthDate))) {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    // ref: 100文字以内
    if (ref !== undefined && ref !== null && (!isString(ref) || ref.length > 100)) {
      return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    }

    // UTM系・deviceType: 各200文字以内
    for (const [field, value] of [["utmSource", utmSource], ["utmMedium", utmMedium], ["utmCampaign", utmCampaign], ["deviceType", deviceType]] as [string, unknown][]) {
      if (value !== undefined && value !== null && (!isString(value) || (value as string).length > 200)) {
        return NextResponse.json({ error: `不正なリクエストです: ${field}` }, { status: 400 });
      }
    }

    await db.insert(diagnoses).values({
      refId: ref || "direct",
      mode: mode,
      topic: topic || null,
      userName: name || null,
      birthDate: birthDate || null,
      paidAmount: 0,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      deviceType: deviceType || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[log-diagnosis]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
