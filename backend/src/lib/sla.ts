/**
 * SLA hours by issue type (PRD Section 9)
 */
export const SLA_HOURS_BY_CATEGORY: Record<string, number> = {
  GARBAGE: 24,
  WATER_SUPPLY: 12,
  ROAD_DAMAGE: 72,
  STREETLIGHT: 24,
  OTHER: 48,
};

export function getSlaDeadline(category: string): Date {
  const hours = SLA_HOURS_BY_CATEGORY[category] ?? 48;
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

export function formatPublicId(num: number): string {
  return `CT-${String(num).padStart(5, "0")}`;
}
