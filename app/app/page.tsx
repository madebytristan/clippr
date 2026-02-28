"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type {
  VideoInfo,
  TranscriptEntry,
  Section,
  AspectRatio,
  CropPosition,
  ClipResult,
} from "@/lib/types";
import { formatTime } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type AppStep =
  | "idle"
  | "loading-info"
  | "info-ready"
  | "loading-transcript"
  | "transcript-ready"
  | "analyzing"
  | "sections-ready"
  | "downloading"
  | "download-ready"
  | "generating";

interface SectionClipState {
  aspectRatio: AspectRatio;
  cropPosition: CropPosition;
  status: "idle" | "generating" | "done" | "error";
  result?: ClipResult;
  error?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "16:9", label: "16:9", icon: "▬" },
  { value: "9:16", label: "9:16", icon: "▮" },
  { value: "1:1", label: "1:1", icon: "■" },
  { value: "4:5", label: "4:5", icon: "▯" },
];

const CROP_POSITIONS: { value: CropPosition; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const TOOLS_ROW1 = [
  {
    id: "clipping",
    label: "AI Clipping",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.499-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
      </svg>
    ),
  },
  {
    id: "moments",
    label: "Find Moments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    id: "editor",
    label: "Video Editor",
    coming: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    id: "summary",
    label: "Video Summary",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    id: "transcript",
    label: "Video Transcripts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    id: "subtitles",
    label: "AI Subtitles",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
];

const TOOLS_ROW2 = [
  {
    id: "reframe",
    label: "AI Reframe",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "broll",
    label: "B-roll",
    coming: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
  },
  {
    id: "hook",
    label: "AI Hook",
    coming: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
];

const LANGUAGES = [
  { value: "auto", label: "Auto / No translation" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
  { value: "de", label: "German" },
];

const CLIP_LENGTHS = [
  { value: "auto", label: "Auto (<90s)" },
  { value: "short", label: "Short (<30s)" },
  { value: "medium", label: "Medium (30-90s)" },
  { value: "long", label: "Long (90-180s)" },
];

// ── Helper components ────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg className="animate-spin" style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Badge({ children, color = "purple" }: { children: React.ReactNode; color?: string }) {
  const cls =
    color === "green" ? "bg-green-900/40 text-green-400 border-green-800" :
    color === "yellow" ? "bg-yellow-900/40 text-yellow-400 border-yellow-800" :
    color === "red" ? "bg-red-900/40 text-red-400 border-red-800" :
    "bg-accent-muted/60 text-accent-light border-accent-muted";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function ToolTab({
  tool,
  active,
  onClick,
}: {
  tool: { id: string; label: string; coming?: boolean; icon: React.ReactNode };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={tool.coming}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors
        ${tool.coming
          ? "border-surface-border text-gray-600 cursor-not-allowed"
          : active
          ? "border-accent text-accent-light bg-accent-muted/30"
          : "border-surface-border text-gray-300 hover:border-gray-500 hover:text-white"
        }`}
    >
      {tool.icon}
      {tool.label}
      {tool.coming && <span className="text-[10px] text-gray-600 ml-0.5">Soon</span>}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AppPage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<AppStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [clipStates, setClipStates] = useState<Record<string, SectionClipState>>({});
  const transcriptRef = useRef<HTMLDivElement>(null);

  // New tool/settings state
  const [activeTool, setActiveTool] = useState("clipping");
  const [language, setLanguage] = useState("auto");
  const [clipLength, setClipLength] = useState("auto");

  // Pre-fill URL from query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) setUrl(urlParam);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function showError(msg: string) { setError(msg); }

  function initClipStates(secs: Section[]) {
    const initial: Record<string, SectionClipState> = {};
    for (const s of secs) {
      initial[s.id] = { aspectRatio: "16:9", cropPosition: "center", status: "idle" };
    }
    setClipStates(initial);
  }

  function updateClipState(id: string, patch: Partial<SectionClipState>) {
    setClipStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function updateSection(id: string, patch: Partial<Section>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  // ── API Calls ─────────────────────────────────────────────────────────────

  async function handleFetchInfo() {
    if (!url.trim()) return;
    setError(null);
    setStep("loading-info");
    try {
      const res = await fetch("/api/video-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideoInfo(data);
      setStep("info-ready");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to fetch video info");
      setStep("idle");
    }
  }

  async function handleFetchTranscript(autoAnalyze: boolean) {
    if (!videoInfo) return;
    setError(null);
    setStep(autoAnalyze ? "analyzing" : "loading-transcript");
    setTranscript([]);
    setSections([]);
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: videoInfo.id, duration: videoInfo.duration, analyzeSections: autoAnalyze }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTranscript(data.transcript ?? []);
      if (autoAnalyze && data.sections?.length) {
        setSections(data.sections);
        initClipStates(data.sections);
        setStep("sections-ready");
      } else {
        setStep("transcript-ready");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to fetch transcript");
      setStep("info-ready");
    }
  }

  async function handleAnalyzeSections() {
    if (!videoInfo || transcript.length === 0) return;
    setError(null);
    setStep("analyzing");
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: videoInfo.id, duration: videoInfo.duration, analyzeSections: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.sections?.length) {
        setSections(data.sections);
        initClipStates(data.sections);
        setStep("sections-ready");
      } else {
        throw new Error("No sections returned from analysis.");
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Section analysis failed");
      setStep("transcript-ready");
    }
  }

  async function handleDownloadVideo() {
    if (!videoInfo) return;
    setError(null);
    setStep("downloading");
    setDownloadProgress(0);
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, videoId: videoInfo.id }),
      });
      if (!response.ok || !response.body) throw new Error("Download request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "progress") setDownloadProgress(payload.percent);
          else if (payload.type === "done") { setVideoPath(payload.videoPath); setStep("download-ready"); }
          else if (payload.type === "error") throw new Error(payload.message);
        }
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Download failed");
      setStep("sections-ready");
    }
  }

  async function handleGenerateClip(section: Section) {
    if (!videoPath) return;
    const cfg = clipStates[section.id];
    if (!cfg) return;
    setError(null);
    updateClipState(section.id, { status: "generating" });
    try {
      const res = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath, sectionId: section.id, startTime: section.startTime, endTime: section.endTime, aspectRatio: cfg.aspectRatio, cropPosition: cfg.cropPosition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateClipState(section.id, { status: "done", result: { sectionId: section.id, filename: data.filename, downloadUrl: data.downloadUrl, size: data.size } });
    } catch (err: unknown) {
      updateClipState(section.id, { status: "error", error: err instanceof Error ? err.message : "Clip generation failed" });
    }
  }

  async function handleGenerateAllClips() {
    if (!videoPath || sections.length === 0) return;
    setStep("generating");
    for (const section of sections) await handleGenerateClip(section);
    setStep("download-ready");
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isLoading = ["loading-info", "loading-transcript", "analyzing", "downloading", "generating"].includes(step);
  const canDownload = (step === "sections-ready" || step === "download-ready") && !videoPath;

  // ── Render: Idle / loading-info ───────────────────────────────────────────

  if (step === "idle" || step === "loading-info") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0d14" }}>
        <header className="flex items-center gap-3 px-6 py-4 border-b border-surface-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-white font-semibold tracking-tight">Clippr</span>
          </Link>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <h1 className="text-3xl font-bold text-white text-center mb-2">Paste a YouTube link</h1>
          <p className="text-gray-500 text-sm mb-8 text-center">We&apos;ll fetch the video info instantly</p>
          <div className="w-full max-w-xl flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && handleFetchInfo()}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
              className="flex-1 bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <button
              onClick={handleFetchInfo}
              disabled={!url.trim() || isLoading}
              className="px-6 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center gap-2 shrink-0"
            >
              {step === "loading-info" ? <><Spinner size={14} /> Loading…</> : "Continue →"}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-4 flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}
        </main>
      </div>
    );
  }

  // ── Render: info-ready / analyzing — "Choose what to do" ─────────────────

  if (step === "info-ready" || step === "analyzing" || step === "loading-transcript") {
    const busy = step === "analyzing" || step === "loading-transcript";

    return (
      <div className="min-h-screen flex flex-col items-center py-10 px-6" style={{ backgroundColor: "#0d0d14" }}>

        {/* Top bar */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-10">
          <button
            onClick={() => { setStep("idle"); setVideoInfo(null); setError(null); }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="text-white font-medium text-sm">Clippr</span>
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
          Choose what to do with this video
        </h1>

        {/* Tool tabs row 1 */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {TOOLS_ROW1.map((tool) => (
            <ToolTab
              key={tool.id}
              tool={tool}
              active={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
            />
          ))}
        </div>

        {/* Tool tabs row 2 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {TOOLS_ROW2.map((tool) => (
            <ToolTab
              key={tool.id}
              tool={tool}
              active={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
            />
          ))}
        </div>

        {/* URL pill */}
        <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-surface-card border border-surface-border">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-gray-500 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          <span className="text-xs text-gray-400 max-w-xs truncate">{url}</span>
        </div>

        {/* Video card */}
        {videoInfo && (
          <div className="rounded-xl border border-surface-border overflow-hidden w-64 mb-8 bg-surface-card">
            <div className="relative aspect-video bg-surface">
              {videoInfo.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                    <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                </div>
              </div>
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                {formatTime(videoInfo.duration)}
              </div>
            </div>
            <div className="p-3">
              <p className="text-white text-sm font-medium line-clamp-2 leading-snug">{videoInfo.title}</p>
              <p className="text-gray-500 text-xs mt-1">
                YouTube{videoInfo.uploader ? ` • ${videoInfo.uploader}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="w-full max-w-sm space-y-3 mb-7">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-surface-card border border-surface-border text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Clip Length</label>
            <select
              value={clipLength}
              onChange={(e) => setClipLength(e.target.value)}
              className="bg-surface-card border border-surface-border text-sm text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent"
            >
              {CLIP_LENGTHS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => handleFetchTranscript(true)}
          disabled={busy}
          className="w-full max-w-sm py-3.5 rounded-full text-white font-bold text-base flex items-center justify-center gap-2 transition-colors"
          style={{
            background: busy ? "#6d28d9" : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            boxShadow: busy ? "none" : "0 0 24px 4px rgba(124, 58, 237, 0.35)",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <><Spinner size={18} /> Analyzing with AI…</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              One Click to Grasp Moments Instantly
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-4 flex items-center gap-1.5">
            <span>⚠</span> {error}
          </p>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-gray-600 mt-4 text-center max-w-sm leading-relaxed">
          By continuing, you confirm the video is your own. Using others&apos; content may violate copyright laws.
        </p>
      </div>
    );
  }

  // ── Render: Results (sections-ready and beyond) ───────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0d0d14" }}>
      <header className="border-b border-surface-border px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => { setStep("info-ready"); setSections([]); setTranscript([]); setVideoPath(null); }}
          className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1.5 mr-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">Clippr</span>
        {videoInfo && <span className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">— {videoInfo.title}</span>}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-300 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Transcript + Sections */}
        {transcript.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-card border border-surface-border rounded-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Transcript</h2>
                <Badge color="green">{transcript.length} entries</Badge>
              </div>
              <div ref={transcriptRef} className="flex-1 overflow-y-auto max-h-96 space-y-1 pr-1">
                {transcript.map((entry, i) => (
                  <div key={i} className="flex gap-2 text-sm hover:bg-surface-hover rounded px-2 py-1">
                    <span className="text-accent-light shrink-0 font-mono text-xs pt-0.5">{formatTime(entry.start)}</span>
                    <span className="text-gray-300">{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-card border border-surface-border rounded-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Sections</h2>
                {sections.length > 0 && <Badge>{sections.length} sections</Badge>}
              </div>
              {(step as string) === "analyzing" && sections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm gap-2">
                  <Spinner /> Analyzing transcript with AI…
                </div>
              ) : sections.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm text-center px-4">
                  No sections yet.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-96 space-y-3 pr-1">
                  {sections.map((section, idx) => (
                    <SectionCard
                      key={section.id}
                      index={idx}
                      section={section}
                      clipState={clipStates[section.id]}
                      videoReady={!!videoPath}
                      videoPath={videoPath}
                      onUpdate={(patch) => updateSection(section.id, patch)}
                      onUpdateClip={(patch) => updateClipState(section.id, patch)}
                      onGenerate={() => handleGenerateClip(section)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Download + Generate */}
        {(step === "sections-ready" || step === "downloading" || step === "download-ready" || step === "generating") && sections.length > 0 && (
          <section className="bg-surface-card border border-surface-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Download &amp; Generate Clips</h2>
            {!videoPath ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Download the source video, then generate clips for each section.</p>
                {step === "downloading" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Downloading video…</span>
                      <span>{downloadProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadVideo}
                    disabled={!canDownload || isLoading}
                    className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-sm text-white rounded-lg flex items-center gap-2"
                  >
                    Download Video (1080p)
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>✓</span><span>Video downloaded and ready.</span>
                </div>
                <button
                  onClick={handleGenerateAllClips}
                  disabled={isLoading || Object.values(clipStates).every((c) => c.status === "done")}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-sm text-white rounded-lg flex items-center gap-2"
                >
                  {step === "generating" ? <><Spinner /> Generating all clips…</> : "Generate All Clips"}
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-surface-border px-6 py-4 text-xs text-gray-600 text-center">
        Clippr — uses yt-dlp, ffmpeg, and Claude AI
      </footer>
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────

interface SectionCardProps {
  index: number;
  section: Section;
  clipState?: SectionClipState;
  videoReady: boolean;
  videoPath?: string | null;
  onUpdate: (patch: Partial<Section>) => void;
  onUpdateClip: (patch: Partial<SectionClipState>) => void;
  onGenerate: () => void;
}

function SectionCard({ index, section, clipState, videoReady, videoPath, onUpdate, onUpdateClip, onGenerate }: SectionCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  function commitTitle() { onUpdate({ title: titleDraft }); setEditingTitle(false); }

  const duration = section.endTime - section.startTime;
  const cfg = clipState ?? { aspectRatio: "16:9" as AspectRatio, cropPosition: "center" as CropPosition, status: "idle" };

  return (
    <div className="border border-surface-border rounded-lg p-3 bg-surface/60 space-y-2">
      <div className="flex items-start gap-2">
        <span className="shrink-0 w-6 h-6 rounded-full bg-accent-muted text-accent-light text-xs font-bold flex items-center justify-center mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle} onKeyDown={(e) => e.key === "Enter" && commitTitle()} className="w-full bg-surface border border-accent rounded px-2 py-0.5 text-sm text-white focus:outline-none" />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="text-sm font-medium text-white hover:text-accent-light text-left truncate w-full" title="Click to edit">{section.title}</button>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{formatTime(section.startTime)} – {formatTime(section.endTime)} <span className="text-gray-600">({Math.round(duration)}s)</span></p>
        </div>
        {videoPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/frame?videoPath=${encodeURIComponent(videoPath)}&time=${section.startTime}`} alt={`Frame at ${formatTime(section.startTime)}`} className="shrink-0 w-24 rounded border border-surface-border object-cover bg-surface" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>

      {section.summary && <p className="text-xs text-gray-500 leading-relaxed pl-8">{section.summary}</p>}

      <div className="pl-8 flex flex-wrap gap-1.5">
        {ASPECT_RATIOS.map((ar) => (
          <button key={ar.value} onClick={() => onUpdateClip({ aspectRatio: ar.value })} className={`px-2 py-0.5 text-xs rounded border font-mono ${cfg.aspectRatio === ar.value ? "bg-accent border-accent text-white" : "border-surface-border text-gray-400 hover:border-accent-muted"}`}>
            {ar.icon} {ar.label}
          </button>
        ))}
        {cfg.aspectRatio !== "16:9" && (
          <div className="flex gap-1">
            {CROP_POSITIONS.map((cp) => (
              <button key={cp.value} onClick={() => onUpdateClip({ cropPosition: cp.value })} className={`px-2 py-0.5 text-xs rounded border ${cfg.cropPosition === cp.value ? "bg-accent/30 border-accent text-accent-light" : "border-surface-border text-gray-500 hover:border-accent-muted"}`}>
                {cp.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pl-8 flex items-center gap-2">
        {cfg.status === "idle" && videoReady && <button onClick={onGenerate} className="px-3 py-1 bg-accent hover:bg-accent-hover text-xs text-white rounded-lg">Generate Clip</button>}
        {cfg.status === "generating" && <span className="text-xs text-gray-400 flex items-center gap-1"><Spinner size={12} /> Generating…</span>}
        {cfg.status === "done" && cfg.result && (
          <a href={cfg.result.downloadUrl} download={cfg.result.filename} className="px-3 py-1 bg-green-800/60 hover:bg-green-700/60 border border-green-700 text-xs text-green-300 rounded-lg flex items-center gap-1">
            ↓ Download{cfg.result.size && <span className="text-green-500 ml-1">({(cfg.result.size / 1024 / 1024).toFixed(1)} MB)</span>}
          </a>
        )}
        {cfg.status === "error" && <span className="text-xs text-red-400">⚠ {cfg.error ?? "Error"}</span>}
        {!videoReady && cfg.status === "idle" && <span className="text-xs text-gray-600">Download video first to generate clip</span>}
      </div>
    </div>
  );
}
