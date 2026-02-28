import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "@/lib/transcript";
import { detectSections } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { videoId, duration, analyzeSections } = await request.json();

    if (!videoId?.trim()) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const transcript = await fetchTranscript(videoId.trim());

    let sections = null;
    if (analyzeSections && duration) {
      sections = await detectSections(transcript, duration);
    }

    return NextResponse.json({ transcript, sections });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
