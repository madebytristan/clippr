import "server-only";
import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

export async function GET() {
  const galleryDir = path.join(process.cwd(), "public", "gallery");

  try {
    const files = await readdir(galleryDir);
    const images = files
      .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .map((f) => ({
        src: `/gallery/${f}`,
        alt: f,
        views: "—",
        revenue: "—",
      }));
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
