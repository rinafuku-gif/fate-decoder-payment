import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import { createToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const mode = searchParams.get("mode") || "full";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!sessionId) {
    return NextResponse.redirect(new URL("/?error=missing_session", appUrl));
  }

  try {
    const session = await getStripeInstance().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.redirect(new URL("/?error=payment_not_completed", appUrl));
    }

    const token = await createToken(sessionId);
    const ref = session.metadata?.ref || "";

    const redirectPath = mode === "compatibility" ? "/compatibility" : "/full";
    const redirectUrl = new URL(redirectPath, appUrl);
    redirectUrl.searchParams.set("payment_token", token);
    if (ref && ref !== "direct") {
      redirectUrl.searchParams.set("ref", ref);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(new URL("/?error=verification_failed", appUrl));
  }
}
