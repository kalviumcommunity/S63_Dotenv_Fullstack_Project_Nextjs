/**
 * CivicTrack – shared static metadata (categories, statuses).
 * All dynamic data now comes from the backend/PostgreSQL.
 */

export const CATEGORIES = [
  { id: "GARBAGE", label: "Garbage", icon: "🗑️", slaHours: 24 },
  { id: "WATER_SUPPLY", label: "Water Supply", icon: "💧", slaHours: 12 },
  { id: "ROAD_DAMAGE", label: "Road Damage", icon: "🛣️", slaHours: 72 },
  { id: "STREETLIGHT", label: "Streetlight", icon: "💡", slaHours: 24 },
  { id: "OTHER", label: "Other", icon: "📌", slaHours: 48 },
] as const;

export const STATUSES = [
  { id: "REPORTED", label: "Reported", color: "indigo" },
  { id: "ASSIGNED", label: "Assigned", color: "amber" },
  { id: "IN_PROGRESS", label: "In Progress", color: "blue" },
  { id: "RESOLVED", label: "Resolved", color: "emerald" },
] as const;

export type IssueStatus = (typeof STATUSES)[number]["id"];
export type IssueCategory = (typeof CATEGORIES)[number]["id"];

// All previous MOCK_* arrays have been removed – data now flows from backend APIs
