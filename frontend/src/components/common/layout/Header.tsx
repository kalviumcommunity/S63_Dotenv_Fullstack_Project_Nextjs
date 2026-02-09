"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/common/ui/Button";
import ThemeToggle from "@/components/common/ui/ThemeToggle";
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
    <header className="sticky top-0 z-50 overflow-visible border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl shadow-sm">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="group relative flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 rounded-md"
          >
            <div className="relative">
              <span className="relative z-10 rounded-lg bg-[var(--primary)] px-2 py-1 text-white text-xs sm:text-sm shadow-sm transition-all group-hover:shadow-md">
                CT
              </span>
            </div>
            <span className="text-[var(--foreground)] hidden sm:inline">
              CivicTrack
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative overflow-hidden rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                    isActive
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                  )}
                >
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Role-based Account Link */}
                {user?.role === "admin" ? (
                  <Link href="/admin">
                    <Button variant="primary" size="sm">
                      <span className="hidden sm:inline">Admin</span>
                      <span className="sm:hidden">Admin</span>
                    </Button>
                  </Link>
                ) : user?.role === "officer" ? (
                  <Link href="/officer">
                    <Button variant="primary" size="sm">
                      <span className="hidden sm:inline">Officer</span>
                      <span className="sm:hidden">Officer</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button variant="primary" size="sm">
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden">Dashboard</span>
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="group relative overflow-hidden"
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
                <Button variant="primary" size="sm">
                  Account
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-all hover:bg-[var(--accent)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
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
          <div className="border-t border-[var(--border)] bg-[var(--card)] py-4 md:hidden">
            <nav className="flex flex-col gap-1 px-4">
              {filteredItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
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
                    className="block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--primary-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  >
                    Account
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <div className="mt-2 flex flex-col gap-2">
                  {user?.role === "admin" ? (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--primary-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    >
                      Admin Dashboard
                    </Link>
                  ) : user?.role === "officer" ? (
                    <Link
                      href="/officer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--primary-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    >
                      Officer Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--primary-dark)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    >
                      My Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutClick();
                    }}
                    disabled={isLoggingOut}
                    className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--accent)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
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
    </header>
  );
}
