"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { safeVariants } from "@/lib/animations";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const getRoleMessage = () => {
    if (!user) return "You need to be logged in to access this page.";
    
    switch (user.role) {
      case "citizen":
        return "This page is only accessible to administrators and officers.";
      case "officer":
        return "This page is only accessible to administrators.";
      case "admin":
        return "This page requires a different role.";
      default:
        return "You don't have permission to access this page.";
    }
  };

  const getSuggestedLinks = () => {
    if (!user) {
      return [
        { href: "/login", label: "Login", description: "Sign in to your account" },
        { href: "/", label: "Home", description: "Go back to homepage" },
      ];
    }

    switch (user.role) {
      case "citizen":
        return [
          { href: "/dashboard", label: "My Issues", description: "View your reported issues" },
          { href: "/report", label: "Report Issue", description: "Report a new issue" },
          { href: "/", label: "Home", description: "Go back to homepage" },
        ];
      case "officer":
        return [
          { href: "/officer", label: "Officer Dashboard", description: "View your assigned issues" },
          { href: "/dashboard", label: "My Issues", description: "View your reported issues" },
          { href: "/", label: "Home", description: "Go back to homepage" },
        ];
      case "admin":
        return [
          { href: "/admin", label: "Admin Dashboard", description: "View admin analytics" },
          { href: "/admin/issues", label: "Assign Issues", description: "Assign issues to officers" },
          { href: "/", label: "Home", description: "Go back to homepage" },
        ];
      default:
        return [
          { href: "/", label: "Home", description: "Go back to homepage" },
        ];
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        variants={safeVariants.fadeIn}
        initial="initial"
        animate="animate"
        className="w-full max-w-2xl space-y-8 text-center"
      >
        {/* Icon */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100">
          <svg
            className="h-12 w-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-3">
            Access Denied
          </h1>
          <p className="text-lg text-[var(--muted)]">
            {getRoleMessage()}
          </p>
        </div>

        {/* Current Role Info */}
        {user && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600 mb-1">Your current role:</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {user.role === "citizen" ? "Citizen" : user.role}
            </p>
          </div>
        )}

        {/* Suggested Links */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--muted)]">
            You might be looking for:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {getSuggestedLinks().map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition hover:border-cyan-500 hover:shadow-lg"
              >
                <p className="font-semibold text-[var(--foreground)] group-hover:text-cyan-600 transition-colors">
                  {link.label}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-left">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> If you believe you should have access to this page, please contact your administrator or check your account role.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
