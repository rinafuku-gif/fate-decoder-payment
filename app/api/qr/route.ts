import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const qrDataUrl = await QRCode.toDataURL(appUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#7c3aed",
        light: "#ffffff",
      },
    });

    // Return the PNG buffer directly
    const base64 = qrDataUrl.replace("data:image/png;base64,", "");
    const buffer = Buffer.from(base64, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("QR generation error:", err);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
