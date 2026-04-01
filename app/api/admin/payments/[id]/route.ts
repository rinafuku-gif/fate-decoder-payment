import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { kickbackPayments, locations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { buildStatementText, generateStatementNumber, formatDateJP } from "@/lib/statement";

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

    // Send payment notification email with statement to partner
    try {
      const [payment] = await db.select().from(kickbackPayments)
        .where(eq(kickbackPayments.id, parseInt(id)));
      if (payment) {
        const [loc] = await db.select().from(locations)
          .where(eq(locations.refId, payment.locationRef));
        if (loc?.contactEmail) {
          // 明細書番号を逆算（aggregate時にcreated順で採番されるが、ここではID-basedで近似）
          const statementNumber = generateStatementNumber(payment.periodStart, payment.id % 1000);
          const monthlyAmount = payment.diagnosisCount * payment.unitAmount;
          const carriedOver = payment.amount - monthlyAmount;

          const statementText = buildStatementText({
            statementNumber,
            issuedDate: formatDateJP(new Date().toISOString().split("T")[0]),
            contactName: loc.contactName || "",
            locationName: loc.name,
            periodStart: payment.periodStart,
            periodEnd: payment.periodEnd,
            count: payment.diagnosisCount,
            unitRate: payment.unitAmount,
            monthlyAmount,
            carriedOver: carriedOver > 0 ? carriedOver : 0,
            totalAmount: payment.amount,
          });

          await sendPaymentNotification(
            loc.contactEmail,
            loc.contactName || loc.name,
            payment.periodStart,
            payment.periodEnd,
            payment.amount,
            statementText,
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
  to: string, name: string, periodStart: string, periodEnd: string, amount: number, statementText: string
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
以下に支払明細書を添付いたします。

${statementText}

ご不明な点がございましたら、お気軽にご連絡ください。

今後ともよろしくお願いいたします。

星の図書館
SATOYAMA AI BASE
r.inafuku@tonari2tomaru.com`.trim(),
  });
}
