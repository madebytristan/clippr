import { NextRequest, NextResponse } from "next/server";
import { createClip } from "@/lib/ffmpeg";
import { getTempDir } from "@/lib/ytdlp";
import path from "path";
import fs from "fs";
import type { AspectRatio, CropPosition } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const {
      videoPath,
      sectionId,
      startTime,
      endTime,
      aspectRatio,
      cropPosition,
    }: {
      videoPath: string;
      sectionId: string;
      startTime: number;
      endTime: number;
      aspectRatio: AspectRatio;
      cropPosition: CropPosition;
    } = await request.json();

    if (!videoPath || !sectionId || endTime <= startTime) {
      return NextResponse.json(
        { error: "Invalid clip parameters" },
        { status: 400 }
      );
    }

    // Validate the videoPath is within our temp dir (security check)
    const tempDir = getTempDir();
    const resolvedInput = path.resolve(videoPath);
    const resolvedTemp = path.resolve(tempDir);
    if (!resolvedInput.startsWith(resolvedTemp)) {
      return NextResponse.json(
        { error: "Invalid video path" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(resolvedInput)) {
      return NextResponse.json(
        { error: "Source video not found. Please re-download." },
        { status: 404 }
      );
    }

    const ratioSlug = aspectRatio.replace(":", "x");
    const filename = `clip-${sectionId}-${ratioSlug}-${cropPosition}.mp4`;
    const outputPath = path.join(tempDir, filename);

    await createClip({
      inputPath: resolvedInput,
      outputPath,
      startTime,
      endTime,
      aspectRatio,
      cropPosition,
    });

    const stat = fs.statSync(outputPath);

    return NextResponse.json({
      filename,
      downloadUrl: `/api/file/${filename}`,
      size: stat.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Clip generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
