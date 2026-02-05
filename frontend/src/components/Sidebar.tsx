"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  protected?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/feed", label: "Issue Feed", icon: "📋" },
  { href: "/map", label: "Map", icon: "🗺️" },
  { href: "/report", label: "Report Issue", icon: "➕" },
  { href: "/dashboard", label: "My Issues", icon: "📊", protected: true },
  { href: "/officer", label: "Officer", icon: "👮", protected: true },
  { href: "/admin", label: "Admin", icon: "⚙️", protected: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const { isAuthenticated } = useAuth();

  const filteredItems = navItems.filter((item) => !item.protected || isAuthenticated);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform border-r border-[var(--border)] bg-[var(--card)] transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Navigation</h2>
            <button
              onClick={close}
              className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) close();
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
