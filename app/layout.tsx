import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond, Shippori_Mincho, Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  weight: ["400", "700"],
  variable: "--font-display",
  subsets: ["latin"],
  display: "optional",
});

const ebGaramond = EB_Garamond({
  weight: ["400", "500"],
  variable: "--font-body-en",
  subsets: ["latin"],
  display: "optional",
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

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500"],
  variable: "--font-ui",
  subsets: ["latin"],
  display: "optional",
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
    <html lang="ja" className={`${playfairDisplay.variable} ${ebGaramond.variable} ${shipporiMincho.variable} ${notoSerifJP.variable} ${notoSansJP.variable} h-full antialiased`}>
      <head>
        <link rel="preload" as="image" href="/bg-library-main.webp" />
        <link rel="preload" as="image" href="/bg-library-main-m.webp" media="(max-width: 768px)" />
        <link rel="prefetch" as="image" href="/bg-library-aisle.webp" />
        <link rel="prefetch" as="image" href="/bg-library-desk.webp" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
