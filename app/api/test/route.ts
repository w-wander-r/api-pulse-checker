// app/api/debug-better-auth/route.ts
import { NextResponse } from "next/server";

export const GET = async () => {
  const url = process.env.BETTER_AUTH_URL;
  return NextResponse.json({
    BETTER_AUTH_URL: url,
    // also show the raw env‑var count for safety
    envKeys: Object.keys(process.env).filter((k) => k.startsWith("BETTER")),
  });
};
