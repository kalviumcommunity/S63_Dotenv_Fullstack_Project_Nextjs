"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/common/ui/Button";
import ConfirmationModal from "@/components/common/feedback/ConfirmationModal";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  protected?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  protected?: boolean;
  requireRole?: "admin" | "officer" | "citizen";
}

const navItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Issue Feed" },
  { href: "/map", label: "Map" },
  { href: "/report", label: "Report Issue" },
  { href: "/dashboard", label: "My Issues", protected: true },
  { href: "/officer", label: "Officer Dashboard", protected: true, requireRole: "officer" },
  { href: "/admin", label: "Admin Dashboard", protected: true, requireRole: "admin" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = navItems.filter((item) => {
    // Show public items to everyone
    if (!item.protected) return true;
    
    // Show protected items only if authenticated
    if (!isAuthenticated) return false;
    
    // If role is required, check user role
    if (item.requireRole) {
      return user?.role === item.requireRole;
    }
    
    // Protected but no role requirement (e.g., dashboard)
    return true;
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    toast.success("Logged out successfully");
    logout(() => {
      router.push("/");
    });
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAuthDropdownOpen(false);
      }
    }

    if (authDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [authDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b-2 border-cyan-200/30 bg-gradient-to-r from-cyan-50/80 via-blue-50/80 to-teal-50/80 shadow-lg backdrop-blur-xl">
      {/* Water Wave Effect */}
      <div className="absolute inset-0 overflow-hidden" style={{ height: "100px" }}>
        <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: "60px" }}>
          <path
            fill="rgba(59, 130, 246, 0.15)"
            d="M0,30L48,35C96,40,192,50,288,50C384,50,480,40,576,35C672,30,768,30,864,35C960,40,1056,50,1152,50C1248,50,1344,40,1392,35L1440,30L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            className="animate-water-wave"
          />
        </svg>
      </div>

      {/* Floating Water Bubbles */}
      {[...Array(10)].map((_, i) => {
        const baseDelay = i * 0.5;
        const baseDuration = 4 + (i % 3);
        const bubbleConfig = {
          left: `${8 + (i % 5) * 18}%`,
          initialTop: `${60 + Math.sin(i) * 15}%`,
          size: `${6 + (i % 4) * 3}px`,
          duration: `${baseDuration}s`,
          delay: `${baseDelay}s`,
        };
        return (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/25 water-bubble-header"
            style={{
              left: bubbleConfig.left,
              top: bubbleConfig.initialTop,
              width: bubbleConfig.size,
              height: bubbleConfig.size,
              animationName: "water-bubble-float",
              animationDuration: bubbleConfig.duration,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: bubbleConfig.delay,
            }}
          />
        );
      })}

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo with Water Effect */}
          <Link
            href="/"
            className="group relative flex items-center gap-2 text-xl font-bold tracking-tight transition-all hover:scale-105"
          >
            <div className="relative">
              <span className="relative z-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 px-2 py-1 text-white text-sm shadow-lg transition-all group-hover:shadow-cyan-500/50">
                CT
              </span>
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
              CivicTrack
            </span>
          </Link>

          {/* Desktop Navigation with Water Ripple Effect */}
          <nav className="hidden items-center gap-2 md:flex">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-700 shadow-md"
                      : "text-gray-700 hover:text-cyan-700"
                  )}
                >
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 animate-pulse" />
                  )}
                  <div className="absolute inset-0 scale-0 rounded-full bg-cyan-400/20 transition-transform duration-500 group-hover:scale-100" />
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Role-based Account Link */}
                {user?.role === "admin" ? (
                  <Link href="/admin">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/50"
                    >
                      Admin
                    </Button>
                  </Link>
                ) : user?.role === "officer" ? (
                  <Link href="/officer">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/50"
                    >
                      Officer
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/50"
                    >
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="group relative overflow-hidden border-cyan-300 text-cyan-700 transition-all hover:bg-cyan-50 hover:border-cyan-400 disabled:opacity-50"
                >
                  <span className={cn("relative z-10 transition-all", isLoggingOut && "animate-pulse")}>
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </span>
                  {isLoggingOut && (
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-teal-400/20 animate-pulse" />
                  )}
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/50"
                >
                  Account
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-gray-700 transition-all hover:bg-cyan-100/50 md:hidden"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t-2 border-cyan-200/30 bg-gradient-to-b from-white/90 to-cyan-50/50 py-4 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col gap-2">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-700"
                        : "text-gray-700 hover:bg-cyan-100/50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {!isAuthenticated && (
                <div className="mt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg transition-all hover:from-cyan-700 hover:to-blue-700"
                  >
                    Account
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <div className="mt-2 flex flex-col gap-2">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg transition-all hover:from-cyan-700 hover:to-blue-700"
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="group relative overflow-hidden rounded-xl border border-cyan-300 px-4 py-2.5 text-center text-sm font-medium text-cyan-700 transition-all hover:bg-cyan-100/50 disabled:opacity-50"
                  >
                    <span className={cn("relative z-10", isLoggingOut && "animate-pulse")}>
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </span>
                    {isLoggingOut && (
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-teal-400/20 animate-pulse" />
                    )}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )        }
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out? You'll need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="default"
        isLoading={isLoggingOut}
      />

      <style jsx>{`
        @keyframes water-wave {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-20px) translateY(-5px); }
        }
        @keyframes water-bubble-float {
          0% { 
            transform: translateY(0) translateX(0) scale(0.6); 
            opacity: 0; 
          }
          10% { 
            opacity: 0.2; 
          }
          30% { 
            transform: translateY(-30px) translateX(3px) scale(0.9); 
            opacity: 0.4; 
          }
          50% { 
            transform: translateY(-60px) translateX(-2px) scale(1.1); 
            opacity: 0.6; 
          }
          70% { 
            transform: translateY(-90px) translateX(4px) scale(1.2); 
            opacity: 0.5; 
          }
          90% { 
            transform: translateY(-120px) translateX(-1px) scale(1); 
            opacity: 0.3; 
          }
          100% { 
            transform: translateY(-150px) translateX(0) scale(0.7); 
            opacity: 0; 
          }
        }
        .animate-water-wave { 
          animation-name: water-wave;
          animation-duration: 4s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .water-bubble-header {
          will-change: transform, opacity;
        }
      `}</style>
    </header>
  );
}
