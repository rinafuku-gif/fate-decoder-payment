import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { diagnoses } from "@/drizzle/schema";

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

      console.log("[Webhook] Payment completed:", {
        sessionId: session.id,
        email: session.customer_details?.email,
        amount: session.amount_total,
        mode,
        ref,
      });

      // DB記録
      try {
        await db.insert(diagnoses).values({
          refId: ref,
          mode,
          paidAmount: Math.round((session.amount_total || 0) / 1),
          stripeSessionId: session.id,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error("[Webhook] DB insert error:", dbErr);
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
