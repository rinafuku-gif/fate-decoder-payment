import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "うらら — 6つの占術で読む、あなたの物語",
  description:
    "うららとれきが6つの占術であなたの本質を読み解きます。ショート診断は無料。",
  openGraph: {
    title: "うらら — 6つの占術で読む、あなたの物語",
    description: "うららとれきが6つの占術であなたの本質を読み解きます。ショート診断は無料。",
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
