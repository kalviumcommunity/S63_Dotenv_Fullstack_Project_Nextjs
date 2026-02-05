"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import PageTransition from "./animations/PageTransition";
import OfflineBanner from "./offline/OfflineBanner";

interface AppLayoutProps {
  children: ReactNode;
}

const FULL_SCREEN_PAGES = ["/auth", "/login", "/signup"];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_PAGES.includes(pathname);

  if (isFullScreen) {
    return (
      <>
        <OfflineBanner />
        <PageTransition>{children}</PageTransition>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <OfflineBanner />
      <Header />
      <main className="flex-1">
        <div className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <Footer />
    </div>
  );
}
