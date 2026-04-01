import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { kickbackPayments, locations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.status === "paid") {
    await db.update(kickbackPayments)
      .set({ status: "paid", paidAt: new Date().toISOString() })
      .where(eq(kickbackPayments.id, parseInt(id)));

    // Send payment notification email to partner
    try {
      const [payment] = await db.select().from(kickbackPayments)
        .where(eq(kickbackPayments.id, parseInt(id)));
      if (payment) {
        const [loc] = await db.select().from(locations)
          .where(eq(locations.refId, payment.locationRef));
        if (loc?.contactEmail) {
          await sendPaymentNotification(
            loc.contactEmail,
            loc.contactName || loc.name,
            payment.periodStart,
            payment.periodEnd,
            payment.amount,
          );
        }
      }
    } catch (err) {
      console.error("Failed to send payment notification:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

async function sendPaymentNotification(
  to: string, name: string, periodStart: string, periodEnd: string, amount: number
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `星の図書館 <${user}>`,
    to,
    subject: `【星の図書館】${periodStart}〜${periodEnd} のお支払いが完了しました`,
    text: `${name} 様

いつもお世話になっております。
星の図書館です。

${periodStart} 〜 ${periodEnd} 分の紹介料のお支払いが完了しました。

お支払金額: ¥${amount.toLocaleString()}

今後ともよろしくお願いいたします。

星の図書館
SATOYAMA AI BASE
`.trim(),
  });
}
