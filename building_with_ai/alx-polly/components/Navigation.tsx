// Navigation component
import Link from "next/link";

export function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold text-blue-600">
            ALX Polly
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/polls" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              All Polls
            </Link>
            <Link 
              href="/polls/new" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Poll
            </Link>
            <Link 
              href="/auth" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
