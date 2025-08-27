import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteBaseUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const revalidate = 86400;

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: {
    default: "ALX Polly",
    template: "%s | ALX Polly",
  },
  description: "Create and share polls with QR codes",
  openGraph: {
    title: "ALX Polly",
    description: "Create and share polls with QR codes",
    url: siteBaseUrl,
    siteName: "ALX Polly",
    images: [
      {
        url: `${siteBaseUrl}/og.png`,
        width: 1200,
        height: 630,
        alt: "ALX Polly – Create and share polls with QR codes",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALX Polly",
    description: "Create and share polls with QR codes",
    images: [`${siteBaseUrl}/og.png`],
    creator: "@alx_polly",
  },
  icons: {
    icon: [
      { url: `${siteBaseUrl}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${siteBaseUrl}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
    ],
    shortcut: [
      `${siteBaseUrl}/favicon.ico`,
    ],
    apple: [
      { url: `${siteBaseUrl}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: `${siteBaseUrl}/safari-pinned-tab.svg` },
    ],
  },
  manifest: `${siteBaseUrl}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: PropsWithChildren<{}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} ${geistMono.variable} antialiased h-screen flex flex-col`}>
        <header className="border-b bg-background">
          <div className="container flex items-center justify-between h-14 px-4">
            <Link href="/polls" className="font-semibold">ALX Polly</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/polls" className="text-foreground/80 hover:text-foreground">My Polls</Link>
              <Link href="/polls/new" className="text-foreground/80 hover:text-foreground">Create Poll</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t text-xs text-muted-foreground">
          <div className="container px-4 py-6">© {new Date().getFullYear()} ALX Polly. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}
