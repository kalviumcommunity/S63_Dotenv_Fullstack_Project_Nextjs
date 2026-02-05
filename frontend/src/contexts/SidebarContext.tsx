"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-open");
    if (stored !== null) {
      setIsOpen(stored === "true");
    } else {
      setIsOpen(window.innerWidth >= 1024);
    }
  }, []);

  const toggle = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    localStorage.setItem("sidebar-open", String(newValue));
  };

  const open = () => {
    setIsOpen(true);
    localStorage.setItem("sidebar-open", "true");
  };

  const close = () => {
    setIsOpen(false);
    localStorage.setItem("sidebar-open", "false");
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
