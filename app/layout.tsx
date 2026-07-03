import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const description = "A calm, artistic space to capture, revisit, and reflect on your dreams.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dreamthread.app"),
  title: "Dreamthread",
  description,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Dreamthread",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Dreamthread",
    description,
    url: "/",
    siteName: "Dreamthread",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dreamthread — a quiet place for your nights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dreamthread",
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#040507",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-midnight-900 text-text-50">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
