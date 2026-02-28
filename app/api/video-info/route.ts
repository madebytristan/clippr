import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url?.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    const info = await getVideoInfo(url.trim());
    return NextResponse.json(info);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
