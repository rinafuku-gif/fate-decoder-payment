import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  const targetUrl = ref ? `${appUrl}/?ref=${ref}` : appUrl;

  try {
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
    });

    const base64 = qrDataUrl.replace("data:image/png;base64,", "");
    const buffer = Buffer.from(base64, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
