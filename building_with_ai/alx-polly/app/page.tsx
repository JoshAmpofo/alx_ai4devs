'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">ALX Polly</h1>
        <div>
          {user ? (
            <Link href="/polls" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              Go to Polls
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100">
                Login
              </Link>
              <Link href="/register" className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Create and Share Polls Instantly
        </h2>
        <p className="mt-3 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-5 md:max-w-3xl">
          ALX Polly is the easiest way to create and share polls with your friends, family, or colleagues. Get instant feedback with our real-time polling solution.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link href="/register" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
              Get Started
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link href="/login" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
              I have an account
            </Link>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-6 py-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} ALX Polly. All rights reserved.</p>
      </footer>
    </div>
  );
}