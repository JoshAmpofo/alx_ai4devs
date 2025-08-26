import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
                Create, Share, and Vote on Polls
              </h1>
              <p className="max-w-[600px] text-lg md:text-xl">
                ALX Polly is the easiest way to create and share polls with your friends, family, or community.
              </p>
              <Link href="/polls">
                <Button size="lg" variant="secondary">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.828 0l-4.243 -4.243a8 8 0 1 1 11.314 0z"/></svg>
                </div>
                <h3 className="text-2xl font-bold">Easy to Use</h3>
                <p className="text-gray-500">
                  Create polls in seconds with our simple and intuitive interface.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M12 2l-8 4l8 4l8 -4l-8 -4"/><path d="M4 10l8 4l8 -4"/><path d="M4 18l8 4l8 -4"/></svg>
                </div>
                <h3 className="text-2xl font-bold">Share Anywhere</h3>
                <p className="text-gray-500">
                  Share your polls with a simple link on social media, email, or anywhere else.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-600"><path d="M16 21v-2a4 4 0 0 0 -4 -4h-4a4 4 0 0 0 -4 4v2"/><circle cx="8.5" cy="7.5" r="4.5"/><path d="M18 18h3"/><path d="M21 15v6"/></svg>
                </div>
                <h3 className="text-2xl font-bold">Real-time Results</h3>
                <p className="text-gray-500">
                  Watch the results of your polls update in real-time as people vote.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center w-full h-24 border-t">
        <p className="text-gray-500">© 2024 ALX Polly. All rights reserved.</p>
      </footer>
    </div>
  );
}
