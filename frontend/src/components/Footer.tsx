"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  const [isMounted, setIsMounted] = useState(false);
  const [bubblePositions, setBubblePositions] = useState<Array<{ left: string; bottom: string }>>([]);

  useEffect(() => {
    setIsMounted(true);
    // Generate bubble positions only on client side to avoid hydration mismatch
    setBubblePositions(
      Array.from({ length: 15 }, (_, i) => ({
        left: `${4 + (i % 6) * 15}%`,
        bottom: `${5 + Math.cos(i) * 20}%`,
      }))
    );
  }, []);

  return (
    <footer className="relative mt-auto overflow-visible border-t-2 border-cyan-200/30 bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-teal-50/90 backdrop-blur-xl">
      {/* Water Wave Effect */}
      <div className="absolute top-0 left-0 w-full overflow-hidden" style={{ height: "100px" }}>
        <svg className="w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: "80px" }}>
          <path
            fill="rgba(59, 130, 246, 0.15)"
            d="M0,50L48,45C96,40,192,30,288,30C384,30,480,40,576,45C672,50,768,50,864,45C960,40,1056,30,1152,30C1248,30,1344,40,1392,45L1440,50L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            className="animate-water-wave-reverse"
          />
        </svg>
      </div>

      {/* Floating Water Bubbles - Only render after mount to avoid hydration mismatch */}
      {isMounted &&
        bubblePositions.map((pos, i) => {
          const baseDelay = i * 0.6;
          const baseDuration = 5 + (i % 4);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-teal-400/25 water-bubble-footer"
              style={{
                left: pos.left,
                bottom: pos.bottom,
                width: `${8 + (i % 5) * 4}px`,
                height: `${8 + (i % 5) * 4}px`,
                animationName: "water-bubble-float-up",
                animationDuration: `${baseDuration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${baseDelay}s`,
              }}
            />
          );
        })}

      <div className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="relative z-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 px-2 py-1 text-white text-sm shadow-lg">
                  CT
                </span>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 blur-md opacity-50" />
              </div>
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-xl font-bold text-transparent">
                CivicTrack
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Transparent urban grievance redressal platform. Report issues, track resolution, hold authorities accountable.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/feed" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Issue Feed
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Map View
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Report Issue
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/officer" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Officer Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Admin Panel
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:support@civictrack.com" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  support@civictrack.com
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex gap-3 pt-2">
                <a href="#" className="text-gray-600 transition-colors hover:text-cyan-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 transition-colors hover:text-cyan-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 transition-colors hover:text-cyan-600">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t-2 border-cyan-200/30 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} CivicTrack. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-gray-600 transition-colors hover:text-cyan-600">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes water-wave-reverse {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(20px) translateY(5px); }
        }
        @keyframes water-bubble-float-up {
          0% { 
            transform: translateY(0) translateX(0) scale(0.5); 
            opacity: 0; 
          }
          8% { 
            opacity: 0.15; 
          }
          25% { 
            transform: translateY(-40px) translateX(4px) scale(0.8); 
            opacity: 0.3; 
          }
          45% { 
            transform: translateY(-80px) translateX(-3px) scale(1); 
            opacity: 0.5; 
          }
          65% { 
            transform: translateY(-120px) translateX(5px) scale(1.2); 
            opacity: 0.6; 
          }
          85% { 
            transform: translateY(-160px) translateX(-2px) scale(1.1); 
            opacity: 0.4; 
          }
          95% { 
            opacity: 0.2; 
          }
          100% { 
            transform: translateY(-200px) translateX(0) scale(0.6); 
            opacity: 0; 
          }
        }
        .animate-water-wave-reverse { 
          animation-name: water-wave-reverse;
          animation-duration: 5s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .water-bubble-footer {
          will-change: transform, opacity;
        }
      `}</style>
    </footer>
  );
}
