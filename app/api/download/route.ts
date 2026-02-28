import { NextRequest, NextResponse } from "next/server";
import { spawnDownload } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/download
 * Streams Server-Sent Events:
 *   data: {"type":"progress","percent":42.1}
 *   data: {"type":"done","videoPath":"/tmp/clippr/xxxxx.mp4"}
 *   data: {"type":"error","message":"..."}
 */
export async function POST(request: NextRequest) {
  const { url, videoId } = await request.json();

  if (!url || !videoId) {
    return NextResponse.json(
      { error: "url and videoId are required" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch {
          // Controller may already be closed
        }
      };

      spawnDownload(
        url,
        videoId,
        (percent) => send({ type: "progress", percent }),
        (videoPath) => {
          send({ type: "done", videoPath });
          controller.close();
        },
        (message) => {
          send({ type: "error", message });
          controller.close();
        }
      );
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
