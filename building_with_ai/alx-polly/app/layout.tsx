'use client';

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteBaseUrl } from "@/lib/site";
import AuthProvider, { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function AppLayout({ children }: PropsWithChildren<{}>) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (loading) {
    return (
      <html lang="en">
        <body className={`${geistSans.className} ${geistMono.variable} antialiased h-screen flex flex-col`}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased h-screen flex flex-col`}
      >
        {!isLandingPage && (
          <header className="border-b bg-background">
            <div className="container flex items-center justify-between h-14 px-4">
              <Link href="/" className="font-semibold">
                ALX Polly
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                {user ? (
                  <>
                    <Link
                      href="/polls"
                      className="text-foreground/80 hover:text-foreground"
                    >
                      My Polls
                    </Link>
                    <Link
                      href="/polls/new"
                      className="text-foreground/80 hover:text-foreground"
                    >
                      Create Poll
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-foreground/80 hover:text-foreground"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="text-foreground/80 hover:text-foreground"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
        )}
        <main className={isLandingPage ? "flex-1" : "flex-1"}>{children}</main>
        {!isLandingPage && (
          <footer className="border-t text-xs text-muted-foreground">
            <div className="container px-4 py-6">
              © {new Date().getFullYear()} ALX Polly. All rights reserved.
            </div>
          </footer>
        )}
      </body>
    </html>
  );
}

export default function RootLayout({ children }: PropsWithChildren<{}>) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
