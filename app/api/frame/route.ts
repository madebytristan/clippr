import { NextRequest, NextResponse } from "next/server";
import { extractFrame } from "@/lib/ffmpeg";
import { getTempDir } from "@/lib/ytdlp";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoPath = searchParams.get("videoPath");
  const timeStr = searchParams.get("time");

  if (!videoPath || !timeStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const time = parseFloat(timeStr);
  if (isNaN(time) || time < 0) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  // Security: only serve files within the clippr temp dir
  const tempDir = getTempDir();
  const resolvedPath = path.resolve(videoPath);
  const resolvedTemp = path.resolve(tempDir);
  if (!resolvedPath.startsWith(resolvedTemp)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  if (!fs.existsSync(resolvedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const jpeg = await extractFrame(resolvedPath, time);
    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err) {
    console.error("[frame] extraction failed:", err);
    return NextResponse.json({ error: "Frame extraction failed" }, { status: 500 });
  }
}
