/**
 * Serialize Prisma Issue for JSON response (Decimal fields are not JSON-serializable).
 */
export function serializeIssue(issue: {
  latitude?: unknown;
  longitude?: unknown;
  [key: string]: unknown;
}): Record<string, unknown> {
  const out = { ...issue };
  if (out.latitude != null && typeof (out.latitude as { toNumber?: () => number }).toNumber === "function") {
    out.latitude = (out.latitude as { toNumber: () => number }).toNumber();
  } else if (out.latitude != null && typeof out.latitude === "object") {
    out.latitude = Number(out.latitude);
  }
  if (out.longitude != null && typeof (out.longitude as { toNumber?: () => number }).toNumber === "function") {
    out.longitude = (out.longitude as { toNumber: () => number }).toNumber();
  } else if (out.longitude != null && typeof out.longitude === "object") {
    out.longitude = Number(out.longitude);
  }
  return out;
}
