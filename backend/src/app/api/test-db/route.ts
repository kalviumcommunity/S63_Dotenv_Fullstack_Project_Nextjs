import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
