import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminSession, COOKIE_NAME, EXPIRY } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "試行回数が多すぎます。しばらくお待ちください" }, { status: 429 });
  }

  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || !safeCompare(password, adminPassword)) {
      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    const token = await createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: EXPIRY,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "認証エラー" }, { status: 500 });
  }
}
