import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { diagnoses, referralFees } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeInstance().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ref = session.metadata?.ref || "direct";
      const mode = session.metadata?.mode || "unknown";
      const utmSource = session.metadata?.utm_source || "";
      const utmMedium = session.metadata?.utm_medium || "";
      const utmCampaign = session.metadata?.utm_campaign || "";
      const REFERRAL_FEE = 50; // 円 — 全モード共通。変更時はここだけ修正

      console.log("[Webhook] Payment completed:", {
        sessionId: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        mode,
        ref,
      });

      // DB記録（重複防止: 同一stripeSessionIdがあればスキップ）
      try {
        const existing = await db.select({ id: diagnoses.id }).from(diagnoses).where(eq(diagnoses.stripeSessionId, session.id)).limit(1);
        if (existing.length === 0) {
          await db.insert(diagnoses).values({
            refId: ref,
            mode,
            paidAmount: Math.round((session.amount_total || 0) / 1),
            stripeSessionId: session.id,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            createdAt: new Date().toISOString(),
          });
        } else {
          console.log("[Webhook] Duplicate session skipped:", session.id);
        }
      } catch (dbErr) {
        console.error("[Webhook] DB insert error:", dbErr);
      }

      // QR設置場所へのフィー記録（utm_sourceがある場合のみ）
      if (utmSource) {
        try {
          await db.insert(referralFees).values({
            placeId: utmSource,
            stripeSessionId: session.id,
            mode,
            amount: Math.round((session.amount_total || 0) / 1),
            fee: REFERRAL_FEE,
            status: "unpaid",
            createdAt: new Date().toISOString(),
          });
          console.log(`[Webhook] Referral fee recorded: ${utmSource} → ¥${REFERRAL_FEE}`);
        } catch (feeErr) {
          console.error("[Webhook] Referral fee insert error:", feeErr);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error("[Webhook] Payment failed:", paymentIntent.id);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
