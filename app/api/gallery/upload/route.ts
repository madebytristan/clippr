import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const name = (form.get("name") as string | null) ?? file?.name ?? "image.png";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const galleryDir = path.join(process.cwd(), "public", "gallery");
    await mkdir(galleryDir, { recursive: true });

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = path.join(galleryDir, safeName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ ok: true, path: `/gallery/${safeName}` });
  } catch (err) {
    console.error("[gallery/upload]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
