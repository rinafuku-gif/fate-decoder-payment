import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fate Decoder — 生年月日でわかる、あなたの今",
  description:
    "6つの占術（西洋占星術・四柱推命・数秘術・マヤ暦・算命学・宿曜）をAIが読み解くパーソナル鑑定。ショート診断は無料。",
  openGraph: {
    title: "Fate Decoder — 生年月日でわかる、あなたの今",
    description: "6つの占術をAIが読み解くパーソナル鑑定。ショート診断は無料。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
