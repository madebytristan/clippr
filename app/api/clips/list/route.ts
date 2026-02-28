import "server-only";
import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import os from "os";

export async function GET() {
  const dir = path.join(os.tmpdir(), "clippr");

  try {
    const files = await readdir(dir);
    const mp4s = files.filter((f) => f.endsWith(".mp4"));

    const clips = await Promise.all(
      mp4s.map(async (name) => {
        const filePath = path.join(dir, name);
        const info = await stat(filePath);
        return {
          name,
          size: info.size,
          mtime: info.mtime.toISOString(),
          url: `/api/clips/file?name=${encodeURIComponent(name)}`,
        };
      })
    );

    // Sort newest first
    clips.sort((a, b) => (a.mtime > b.mtime ? -1 : 1));

    return NextResponse.json({ clips });
  } catch {
    // Directory doesn't exist yet — no clips generated
    return NextResponse.json({ clips: [] });
  }
}
