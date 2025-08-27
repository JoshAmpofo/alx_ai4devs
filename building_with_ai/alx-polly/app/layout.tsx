import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ALX Polly",
  description: "Create and share polls with QR codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b bg-background">
          <div className="container mx-auto flex items-center justify-between h-14 px-4">
            <Link href="/polls" className="font-semibold">ALX Polly</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/polls" className="text-foreground/80 hover:text-foreground">My Polls</Link>
              <Link href="/polls/new" className="text-foreground/80 hover:text-foreground">Create Poll</Link>
            </nav>
          </div>
        </header>
        <div className="min-h-[calc(100vh-56px)]">
          {children}
        </div>
        <footer className="border-t text-xs text-muted-foreground">
          <div className="container mx-auto px-4 py-6">© {new Date().getFullYear()} ALX Polly. All rights reserved.</div>
        </footer>
      </body>
    </html>
  );
}
