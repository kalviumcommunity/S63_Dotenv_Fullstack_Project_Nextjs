import { NextResponse } from "next/server";

const ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

export function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", ORIGIN);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

export function jsonWithCors(body: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(body, init);
  return withCors(res);
}
