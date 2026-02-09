import { jsonWithCors } from "@/middleware/cors";

export async function GET() {
  return jsonWithCors({ status: "Backend running" });
}
