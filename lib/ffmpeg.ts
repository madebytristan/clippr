import "server-only";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { resolveFFmpeg } from "./ytdlp";
import type { AspectRatio, CropPosition } from "./types";
import fs from "fs";
import os from "os";
import path from "path";

// Priority: WinGet system ffmpeg > ffmpeg-static bundled binary
const systemFfmpeg = resolveFFmpeg();
if (systemFfmpeg) {
  ffmpeg.setFfmpegPath(systemFfmpeg);
  ffmpeg.setFfprobePath(systemFfmpeg.replace("ffmpeg.exe", "ffprobe.exe"));
} else if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Target output height is always 1080 (or source height if smaller)
const TARGET_HEIGHT = 1080;

/** Aspect ratio targets expressed as width:height multipliers */
const RATIO_TARGETS: Record<AspectRatio, { w: number; h: number }> = {
  "16:9": { w: 16, h: 9 },
  "9:16": { w: 9, h: 16 },
  "1:1": { w: 1, h: 1 },
  "4:5": { w: 4, h: 5 },
};

export interface ClipOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  aspectRatio: AspectRatio;
  cropPosition: CropPosition;
}

/**
 * Build an ffmpeg crop + scale filter string.
 * Always outputs at TARGET_HEIGHT (1080) height.
 */
function buildVideoFilter(
  aspectRatio: AspectRatio,
  cropPosition: CropPosition,
  sourceWidth: number,
  sourceHeight: number
): string | null {
  const { w, h } = RATIO_TARGETS[aspectRatio];

  // Calculate the desired output dimensions
  let outW: number;
  let outH: number;

  if (w >= h) {
    // Landscape or square — base on height
    outH = Math.min(sourceHeight, TARGET_HEIGHT);
    outW = Math.round((outH * w) / h);
    // Make sure width doesn't exceed source
    if (outW > sourceWidth) {
      outW = sourceWidth;
      outH = Math.round((outW * h) / w);
    }
  } else {
    // Portrait — base on height
    outH = Math.min(sourceHeight, TARGET_HEIGHT);
    outW = Math.round((outH * w) / h);
  }

  // Ensure even dimensions (required by most codecs)
  outW = outW % 2 === 0 ? outW : outW - 1;
  outH = outH % 2 === 0 ? outH : outH - 1;

  // No crop needed if dimensions already match source
  if (outW === sourceWidth && outH === sourceHeight) {
    return null;
  }

  // Calculate x offset based on crop position
  const xRange = sourceWidth - outW;
  let x: number;
  if (cropPosition === "left") x = 0;
  else if (cropPosition === "right") x = xRange;
  else x = Math.floor(xRange / 2);

  // Center vertically
  const y = Math.floor((sourceHeight - outH) / 2);

  return `crop=${outW}:${outH}:${x}:${y}`;
}

/** Probe a video file for its stream dimensions. */
export function probeVideo(
  filePath: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const stream = metadata.streams.find((s) => s.codec_type === "video");
      if (!stream || !stream.width || !stream.height) {
        return reject(new Error("Could not determine video dimensions."));
      }
      resolve({ width: stream.width, height: stream.height });
    });
  });
}

/** Extract a single JPEG frame at the given timestamp. Returns raw JPEG buffer. */
export function extractFrame(
  videoPath: string,
  timeSeconds: number
): Promise<Buffer> {
  const tempDir = path.join(os.tmpdir(), "clippr");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const outPath = path.join(
    tempDir,
    `frame_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .inputOptions(["-ss", String(timeSeconds)])
      .frames(1)
      .outputOptions(["-q:v", "3"])
      .output(outPath)
      .on("end", () => {
        try {
          const buf = fs.readFileSync(outPath);
          fs.unlinkSync(outPath);
          resolve(buf);
        } catch (e) {
          reject(e);
        }
      })
      .on("error", (err) => {
        try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch { /* ignore */ }
        reject(err);
      })
      .run();
  });
}

/** Create a clip from a source video. Returns on completion. */
export async function createClip(options: ClipOptions): Promise<void> {
  const { inputPath, outputPath, startTime, endTime, aspectRatio, cropPosition } =
    options;

  const duration = endTime - startTime;
  if (duration <= 0) {
    throw new Error(`Invalid clip duration: ${duration}s`);
  }

  // Probe to get actual source dimensions
  const { width: srcW, height: srcH } = await probeVideo(inputPath);
  const cropFilter = buildVideoFilter(aspectRatio, cropPosition, srcW, srcH);

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .videoCodec("libx264")
      .audioCodec("aac")
      .outputOptions([
        "-preset", "fast",
        "-crf", "23",
        "-movflags", "+faststart",
      ]);

    if (cropFilter) {
      cmd = cmd.videoFilter(cropFilter);
    }

    cmd
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}
