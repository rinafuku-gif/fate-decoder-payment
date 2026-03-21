import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const fateDecoderUrl =
    process.env.FATE_DECODER_URL || "https://v0-fate-decoder.vercel.app";

  if (!sessionId) {
    return NextResponse.redirect(
      new URL("/?error=missing_session", request.url)
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.redirect(
        new URL("/?error=payment_not_completed", request.url)
      );
    }

    // Generate one-time token
    const token = createToken(sessionId);

    // Redirect to Fate Decoder with token
    const redirectUrl = new URL(fateDecoderUrl);
    redirectUrl.searchParams.set("payment_token", token);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(new URL("/?error=verification_failed", request.url));
  }
}
