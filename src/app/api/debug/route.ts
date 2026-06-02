import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    BACKEND_URL: process.env.BACKEND_URL || "(not set)",
    NODE_ENV: process.env.NODE_ENV,
  });
}
