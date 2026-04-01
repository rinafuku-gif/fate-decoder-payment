import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`checkout:${ip}`, 20, 15 * 60 * 1000);
  if (!ok) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらくお待ちください" }, { status: 429 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const body = await request.json();
    const mode = body.mode as "full" | "compatibility";
    const ref = body.ref || "direct";
    const utmSource = body.utmSource || null;
    const utmMedium = body.utmMedium || null;
    const utmCampaign = body.utmCampaign || null;

    const priceId =
      mode === "compatibility"
        ? process.env.STRIPE_PRICE_ID_COMPAT
        : process.env.STRIPE_PRICE_ID_FULL;

    if (!priceId) {
      return NextResponse.json(
        { error: `STRIPE_PRICE_ID for ${mode} is not configured` },
        { status: 500 }
      );
    }

    const session = await getStripeInstance().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${appUrl}/api/callback?session_id={CHECKOUT_SESSION_ID}&mode=${mode}`,
      cancel_url: `${appUrl}/?cancelled=true${ref !== "direct" ? `&ref=${ref}` : ""}`,
      locale: "ja",
      metadata: {
        service: "fate-decoder",
        mode,
        ref,
        utm_source: utmSource || "",
        utm_medium: utmMedium || "",
        utm_campaign: utmCampaign || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
