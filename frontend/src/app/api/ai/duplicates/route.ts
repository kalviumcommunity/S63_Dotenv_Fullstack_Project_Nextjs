import { NextResponse } from "next/server";
import { embedTexts } from "../gemini";

type DuplicateRequest = {
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  wardOrArea?: string;
};

type IssueLite = {
  id: number | string;
  publicId?: string | null;
  title: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  createdAt?: string;
};

type Match = {
  id: IssueLite["id"];
  publicId?: string | null;
  title: string;
  status?: string;
  similarity: number;
  distanceMeters?: number;
};

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
}

function norm(v: number[]): number {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function cosineSim(a: number[], b: number[]): number {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  return dot(a, b) / (na * nb);
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DuplicateRequest;
    if (!body?.title || typeof body.title !== "string") {
      return NextResponse.json({ success: false, message: "Missing title." }, { status: 400 });
    }

    const queryText = [body.title, body.description || "", body.wardOrArea || ""].filter(Boolean).join("\n");

    let issues: IssueLite[] = [];
    try {
      const url = new URL(`${apiBase()}/api/issues`);
      url.searchParams.set("limit", "150");
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as any;
      const list = json?.data?.issues || json?.issues || json?.data || [];
      if (Array.isArray(list)) issues = list as IssueLite[];
    } catch {
      issues = [];
    }

    if (issues.length === 0) {
      return NextResponse.json({
        success: true,
        data: { matches: [] as Match[], note: "No existing issues available for duplicate detection." },
        timestamp: new Date().toISOString(),
      });
    }

    const issueTexts = issues.map((i) => [i.title, i.description || ""].filter(Boolean).join("\n"));
    const embeddings = await embedTexts([queryText, ...issueTexts]);
    const queryEmb = embeddings[0];
    const issueEmbs = embeddings.slice(1);

    const matches: Match[] = issues
      .map((i, idx) => {
        const similarity = cosineSim(queryEmb, issueEmbs[idx]);
        let distanceMeters: number | undefined = undefined;
        if (
          typeof body.latitude === "number" &&
          typeof body.longitude === "number" &&
          typeof i.latitude === "number" &&
          typeof i.longitude === "number"
        ) {
          distanceMeters = haversineMeters(body.latitude, body.longitude, i.latitude, i.longitude);
        }
        return {
          id: i.id,
          publicId: i.publicId ?? null,
          title: i.title,
          status: i.status,
          similarity,
          distanceMeters,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);

    const likelyDuplicates = matches.filter(
      (m) => m.similarity >= 0.82 || (typeof m.distanceMeters === "number" && m.distanceMeters <= 250)
    );

    return NextResponse.json({
      success: true,
      data: {
        matches,
        likelyDuplicates,
        thresholds: { textSimilarity: 0.82, distanceMeters: 250 },
        note:
          "Text similarity uses Gemini embeddings (cosine similarity). Spatial proximity uses Haversine distance when coordinates are available.",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("GEMINI_API_KEY") ? 500 : 502;
    return NextResponse.json({ success: false, message }, { status });
  }
}
