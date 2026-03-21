import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, COOKIE_NAME, EXPIRY } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
    }

    const token = await createAdminSession();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EXPIRY,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "認証エラー" }, { status: 500 });
  }
}
