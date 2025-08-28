'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Subtle particle effect */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="particle absolute w-1 h-1 bg-blue-300 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
          {[...Array(15)].map((_, i) => (
            <div
              key={`purple-${i}`}
              className="particle absolute w-2 h-2 bg-purple-300 rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full animate-float animation-delay-4000"></div>
      </div>

      {/* Interactive cursor effect */}
      <div 
        className="fixed w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ALX Polly
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <Link 
                href="/polls" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300 shadow-md"
              >
                Go to Polls
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-6 py-3 text-gray-700 font-medium rounded-full hover:bg-white/50 hover:shadow-md transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300 shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <div className={`max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Main heading with gradient */}
          <h1 className="text-6xl md:text-8xl font-extrabold mb-10 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Create & Share
            </span>
            <br />
            <span className="text-gray-800">Polls Instantly</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
            Transform your ideas into engaging polls. Share with QR codes, get real-time results, and make decisions faster than ever.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="feature-card group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-white/20 animate-slide-in-up">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Quick Creation</h3>
              <p className="text-gray-600 leading-relaxed">Create polls in seconds with our intuitive interface</p>
            </div>
            
            <div className="feature-card group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-white/20 animate-slide-in-up">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">QR Sharing</h3>
              <p className="text-gray-600 leading-relaxed">Share polls instantly with unique QR codes</p>
            </div>
            
            <div className="feature-card group p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-white/20 animate-slide-in-up">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Real-time Results</h3>
              <p className="text-gray-600 leading-relaxed">See votes and results update instantly</p>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/register" 
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 shadow-lg"
            >
              <span>Get Started Free</span>
              <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <Link 
              href="/login" 
              className="px-10 py-5 border-2 border-gray-300 text-gray-700 font-bold rounded-full text-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:shadow-lg"
            >
              I have an account
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 pt-16 border-t border-gray-200/50">
            <p className="text-gray-500 text-lg mb-6">Trusted by developers and teams worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">⚡</div>
              <div className="text-2xl font-bold text-gray-400">🔒</div>
              <div className="text-2xl font-bold text-gray-400">🚀</div>
              <div className="text-2xl font-bold text-gray-400">💡</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 text-center">
        <div className="border-t border-gray-200/50 pt-8">
          <p className="text-gray-500 text-lg">
            &copy; {new Date().getFullYear()} ALX Polly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}