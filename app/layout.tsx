import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Shippori_Mincho, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  weight: ["600"],
  variable: "--font-serif",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "700"],
  variable: "--font-serif-body",
  subsets: ["latin"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  title: "星の図書館 — うららとれきが、あなたの星を読み解く",
  description:
    "星の記録を読み解く。うららとれき、2人の司書があなたの星の本を見つけてくる。ショート診断は無料。",
  openGraph: {
    title: "星の図書館 — うららとれきが、あなたの星を読み解く",
    description: "星の記録を読み解く。うららとれき、2人の司書があなたの星の本を見つけてくる。ショート診断は無料。",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "星の図書館",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "星の図書館 — うららとれきが、あなたの星を読み解く",
    description: "星の記録を読み解く。うららとれき、2人の司書があなたの星の本を見つけてくる。ショート診断は無料。",
    images: [`${process.env.NEXT_PUBLIC_APP_URL || ""}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${shipporiMincho.variable} ${notoSerifJP.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
