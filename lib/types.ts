export interface VideoInfo {
  id: string;
  title: string;
  duration: number; // seconds
  thumbnail: string;
  uploader?: string;
}

export interface TranscriptEntry {
  text: string;
  start: number;    // seconds
  duration: number; // seconds
}

export interface Section {
  id: string;
  title: string;
  summary: string;
  startTime: number; // seconds
  endTime: number;   // seconds
}

export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:5";
export type CropPosition = "left" | "center" | "right";

export interface ClipConfig {
  aspectRatio: AspectRatio;
  cropPosition: CropPosition;
}

export interface ClipResult {
  sectionId: string;
  filename: string;
  downloadUrl: string;
  size?: number;
}

export interface DownloadEvent {
  type: "progress" | "done" | "error";
  percent?: number;
  videoPath?: string;
  message?: string;
}
