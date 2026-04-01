import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`verify:${ip}`, 30, 15 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "リクエストが多すぎます" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const result = await verifyAndConsumeToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      sessionId: result.sessionId,
    });
  } catch (err) {
    console.error("Verify token error:", err);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
