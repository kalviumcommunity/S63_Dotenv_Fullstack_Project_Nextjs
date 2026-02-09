/**
 * Shared utility functions for CivicTrack UI.
 */

import { type ClassValue, clsx } from "clsx";
import { CATEGORIES } from "@/constants/mockData";

/**
 * Utility to merge classNames (for Tailwind CSS).
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Get human-readable category label from category ID.
 */
export function getCategoryLabel(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

/**
 * Format SLA deadline time remaining (e.g. "24h left", "Overdue").
 */
export function formatSlaDeadline(deadline: string): { text: string; urgent: boolean } {
  const d = new Date(deadline);
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  
  if (ms <= 0) {
    return { text: "Overdue", urgent: true };
  }
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    return { text: `${Math.floor(hours / 24)}d left`, urgent: hours < 48 };
  }
  
  return { text: `${hours}h ${mins}m left`, urgent: hours < 6 };
}
