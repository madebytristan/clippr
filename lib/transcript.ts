import "server-only";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { YoutubeTranscript } from "youtube-transcript";
import type { TranscriptEntry } from "./types";
import { resolveYtDlp, resolveFFmpeg, getTempDir } from "./ytdlp";
import { formatTime } from "./utils";

const execFileAsync = promisify(execFile);

export async function fetchTranscript(
  videoIdOrUrl: string
): Promise<TranscriptEntry[]> {
  const videoId = extractVideoId(videoIdOrUrl) ?? videoIdOrUrl;

  // Primary: yt-dlp — most reliable, works for any video with captions
  try {
    return await fetchViaYtDlp(videoId);
  } catch (err) {
    console.warn(
      "[transcript] yt-dlp failed:",
      err instanceof Error ? err.message : err
    );
  }

  // Fallback: youtube-transcript npm package
  try {
    return await fetchViaNpm(videoId);
  } catch (err) {
    throw new Error(
      `Could not fetch transcript. The video may not have captions or captions are disabled. ` +
        `(${err instanceof Error ? err.message : String(err)})`
    );
  }
}

// ── yt-dlp method ─────────────────────────────────────────────────────────────

async function fetchViaYtDlp(videoId: string): Promise<TranscriptEntry[]> {
  const ytdlp = resolveYtDlp();
  const ffmpeg = resolveFFmpeg();
  const tempDir = getTempDir();
  const outputBase = path.join(tempDir, `sub-${videoId}`);

  const args: string[] = [];

  if (ffmpeg) {
    args.push("--ffmpeg-location", path.dirname(ffmpeg));
  }

  args.push(
    "--write-auto-sub",
    "--sub-lang", "en",
    "--sub-format", "json3",
    "--skip-download",
    "--no-playlist",
    "--no-warnings",
    "-o", outputBase,
    `https://www.youtube.com/watch?v=${videoId}`
  );

  await execFileAsync(ytdlp, args);

  // yt-dlp names the subtitle: {outputBase}.en.json3 (or en-orig.json3)
  const subFile = findSubtitleFile(tempDir, videoId);
  if (!subFile) {
    throw new Error(
      "yt-dlp did not create a subtitle file — video may lack English captions."
    );
  }

  try {
    const content = fs.readFileSync(subFile, "utf-8");
    fs.unlinkSync(subFile);
    const entries = parseJson3(content);
    if (entries.length === 0) throw new Error("json3 had no usable entries");
    return entries;
  } catch (err) {
    if (fs.existsSync(subFile)) fs.unlinkSync(subFile);
    throw err;
  }
}

/** Find the downloaded subtitle file regardless of exact lang suffix yt-dlp used */
function findSubtitleFile(tempDir: string, videoId: string): string | null {
  if (!fs.existsSync(tempDir)) return null;
  const files = fs.readdirSync(tempDir);
  const match = files.find(
    (f) => f.startsWith(`sub-${videoId}`) && f.endsWith(".json3")
  );
  return match ? path.join(tempDir, match) : null;
}

/**
 * Parse YouTube's json3 subtitle format into clean transcript entries.
 * Events with `aAppend: 1` are continuations merged into the previous entry.
 */
function parseJson3(raw: string): TranscriptEntry[] {
  const data = JSON.parse(raw) as {
    events?: Array<{
      tStartMs: number;
      dDurationMs: number;
      aAppend?: number;
      segs?: Array<{ utf8?: string }>;
    }>;
  };

  const entries: TranscriptEntry[] = [];

  for (const ev of data.events ?? []) {
    if (!ev.segs?.length) continue;

    const text = ev.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\n/g, " ")
      .trim();

    if (!text) continue;

    if (ev.aAppend === 1 && entries.length > 0) {
      const prev = entries[entries.length - 1];
      prev.text = (prev.text + " " + text).replace(/\s+/g, " ").trim();
      prev.duration = (ev.tStartMs + ev.dDurationMs) / 1000 - prev.start;
    } else {
      entries.push({
        text,
        start: ev.tStartMs / 1000,
        duration: ev.dDurationMs / 1000,
      });
    }
  }

  return entries.filter((e) => e.text.length >= 2);
}

// ── npm fallback method ───────────────────────────────────────────────────────

async function fetchViaNpm(videoId: string): Promise<TranscriptEntry[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  if (!raw?.length) throw new Error("youtube-transcript returned empty results");
  return raw.map((entry) => ({
    text: cleanHtml(entry.text),
    start: (entry.offset ?? 0) / 1000,
    duration: (entry.duration ?? 0) / 1000,
  }));
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatTranscriptForClaude(entries: TranscriptEntry[]): string {
  return entries.map((e) => `[${formatTime(e.start)}] ${e.text}`).join("\n");
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function cleanHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
