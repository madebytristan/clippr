import "server-only";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";
import type { VideoInfo } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Resolve the yt-dlp executable. Checks the WinGet per-user install location
 * as a fallback so the app works immediately after `winget install yt-dlp`
 * without needing a shell restart.
 */
export function resolveYtDlp(): string {
  if (process.platform === "win32") {
    const wingetPath = path.join(
      os.homedir(),
      "AppData", "Local", "Microsoft", "WinGet", "Packages",
      "yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe",
      "yt-dlp.exe"
    );
    if (fs.existsSync(wingetPath)) return wingetPath;
  }
  return "yt-dlp";
}

/**
 * Resolve the ffmpeg executable, preferring the WinGet yt-dlp FFmpeg build
 * on Windows (installed alongside yt-dlp by winget).
 */
export function resolveFFmpeg(): string | null {
  if (process.platform === "win32") {
    // yt-dlp.FFmpeg winget package
    const base = path.join(
      os.homedir(),
      "AppData", "Local", "Microsoft", "WinGet", "Packages",
      "yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    );
    if (fs.existsSync(base)) {
      const dirs = fs.readdirSync(base);
      for (const d of dirs) {
        const candidate = path.join(base, d, "bin", "ffmpeg.exe");
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return null; // fall back to PATH / ffmpeg-static
}

export function getTempDir(): string {
  const dir =
    process.env.CLIPPR_TEMP_DIR || path.join(os.tmpdir(), "clippr");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const ytdlp = resolveYtDlp();
  try {
    const { stdout } = await execFileAsync(ytdlp, [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      url,
    ]);
    const info = JSON.parse(stdout);
    return {
      id: info.id,
      title: info.title,
      duration: Math.round(info.duration ?? 0),
      thumbnail:
        info.thumbnail ||
        info.thumbnails?.at(-1)?.url ||
        `https://img.youtube.com/vi/${info.id}/maxresdefault.jpg`,
      uploader: info.uploader,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) {
      throw new Error(
        "yt-dlp is not installed. Install it with: winget install yt-dlp"
      );
    }
    throw new Error(`Failed to get video info: ${message}`);
  }
}

/** Streams yt-dlp download progress via callbacks. */
export function spawnDownload(
  url: string,
  videoId: string,
  onProgress: (percent: number) => void,
  onDone: (videoPath: string) => void,
  onError: (message: string) => void
) {
  const ytdlp = resolveYtDlp();
  const tempDir = getTempDir();
  const outputTemplate = path.join(tempDir, `${videoId}.%(ext)s`);

  // Return immediately if already downloaded
  const existingPath = findExistingVideo(tempDir, videoId);
  if (existingPath) {
    onDone(existingPath);
    return;
  }

  const args = [
    "-f",
    "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    "--no-playlist",
    "--newline",
    url,
  ];

  const proc = spawn(ytdlp, args);

  proc.stdout.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      const match = line.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (match) onProgress(parseFloat(match[1]));
    }
  });

  proc.stderr.on("data", (data: Buffer) => {
    console.error("[yt-dlp stderr]", data.toString().trim());
  });

  proc.on("close", (code) => {
    if (code === 0) {
      const videoPath = findExistingVideo(tempDir, videoId);
      if (videoPath) {
        onDone(videoPath);
      } else {
        onError("Download finished but output file not found.");
      }
    } else {
      onError(`yt-dlp exited with code ${code}`);
    }
  });

  proc.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      onError("yt-dlp is not installed. Install it with: winget install yt-dlp");
    } else {
      onError(err.message);
    }
  });
}

function findExistingVideo(dir: string, videoId: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const found = files.find(
    (f) =>
      f.startsWith(videoId) &&
      (f.endsWith(".mp4") || f.endsWith(".mkv") || f.endsWith(".webm"))
  );
  return found ? path.join(dir, found) : null;
}
