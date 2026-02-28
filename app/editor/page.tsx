"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditorClip = {
  id: string;
  name: string;
  duration: number; // seconds
  url: string; // blob: or /api/clips/file?name=...
  thumbnail: string; // data URL or ""
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractThumbnail(url: string): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 160, 90);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve("");
      }
      video.src = "";
    };

    video.onerror = () => resolve("");
    video.src = url;
  });
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LibraryCard({
  clip,
  onAddToTimeline,
  onDragStart,
}: {
  clip: EditorClip;
  onAddToTimeline: (clip: EditorClip) => void;
  onDragStart: (clip: EditorClip) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("clipId", clip.id);
        onDragStart(clip);
      }}
      className="group flex items-center gap-2.5 p-2 rounded-xl border border-surface-border/60 bg-[#0f0f1a] hover:border-accent/40 cursor-grab active:cursor-grabbing transition-colors"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-[80px] h-[45px] rounded-lg overflow-hidden bg-surface-hover flex items-center justify-center">
        {clip.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.thumbnail} alt={clip.name} className="w-full h-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate leading-tight">{clip.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{formatTime(clip.duration)}</p>
      </div>

      {/* Add button */}
      <button
        onClick={() => onAddToTimeline(clip)}
        className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-accent/20 transition-colors opacity-0 group-hover:opacity-100"
        title="Add to timeline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const [libraryClips, setLibraryClips] = useState<EditorClip[]>([]);
  const [timelineClips, setTimelineClips] = useState<EditorClip[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isImporting, setIsImporting] = useState(false);
  const [dragOverTimeline, setDragOverTimeline] = useState(false);
  const [timelineDragIndex, setTimelineDragIndex] = useState<number | null>(null);
  const [timelineDragOverIndex, setTimelineDragOverIndex] = useState<number | null>(null);
  const [libraryDragClip, setLibraryDragClip] = useState<EditorClip | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Video src ────────────────────────────────────────────────────────────────
  const activeClip = timelineClips[activeIndex] ?? null;

  useEffect(() => {
    if (videoRef.current && activeClip) {
      videoRef.current.src = activeClip.url;
      videoRef.current.load();
    }
  }, [activeClip]);

  // ── Upload from disk ─────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newClips: EditorClip[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) continue;
      const url = URL.createObjectURL(file);

      // Get duration
      const duration = await new Promise<number>((resolve) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => resolve(v.duration || 0);
        v.onerror = () => resolve(0);
        v.src = url;
      });

      const thumbnail = await extractThumbnail(url);
      newClips.push({
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, ""),
        duration,
        url,
        thumbnail,
      });
    }

    setLibraryClips((prev) => [...prev, ...newClips]);
  }, []);

  // ── Import from Clippr ───────────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/clips/list");
      const { clips } = await res.json();

      if (!clips || clips.length === 0) {
        showToast("No clips found — generate some in the App first.");
        return;
      }

      const newClips: EditorClip[] = [];
      for (const c of clips) {
        // Check not already in library
        if (libraryClips.some((l) => l.url === c.url)) continue;

        const duration = await new Promise<number>((resolve) => {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => resolve(v.duration || 0);
          v.onerror = () => resolve(0);
          v.src = c.url;
        });

        const thumbnail = await extractThumbnail(c.url);
        newClips.push({
          id: uid(),
          name: c.name.replace(/\.[^.]+$/, ""),
          duration,
          url: c.url,
          thumbnail,
        });
      }

      if (newClips.length === 0) {
        showToast("All clips already imported.");
      } else {
        setLibraryClips((prev) => [...prev, ...newClips]);
        showToast(`Imported ${newClips.length} clip${newClips.length !== 1 ? "s" : ""}.`);
      }
    } catch {
      showToast("Import failed.");
    } finally {
      setIsImporting(false);
    }
  }, [libraryClips]);

  // ── Add clip to timeline ─────────────────────────────────────────────────────
  const addToTimeline = useCallback((clip: EditorClip) => {
    setTimelineClips((prev) => [...prev, { ...clip, id: uid() }]);
  }, []);

  // ── Remove from timeline ─────────────────────────────────────────────────────
  const removeFromTimeline = (index: number) => {
    setTimelineClips((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  // ── Shuffle ──────────────────────────────────────────────────────────────────
  const shuffleTimeline = () => {
    if (timelineClips.length < 2) return;
    setTimelineClips((prev) => shuffleArray(prev));
    setActiveIndex(0);
  };

  // ── Timeline drop (from library) ─────────────────────────────────────────────
  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTimeline(false);

    // Reorder within timeline
    if (timelineDragIndex !== null && timelineDragOverIndex !== null && timelineDragIndex !== timelineDragOverIndex) {
      setTimelineClips((prev) => {
        const next = [...prev];
        const [removed] = next.splice(timelineDragIndex, 1);
        next.splice(timelineDragOverIndex, 0, removed);
        return next;
      });
      setTimelineDragIndex(null);
      setTimelineDragOverIndex(null);
      return;
    }

    // Drop from library
    if (libraryDragClip) {
      addToTimeline(libraryDragClip);
      setLibraryDragClip(null);
    }

    setTimelineDragIndex(null);
    setTimelineDragOverIndex(null);
  };

  // ── Auto-advance on video end ─────────────────────────────────────────────────
  const handleVideoEnded = () => {
    if (activeIndex < timelineClips.length - 1) {
      setActiveIndex((i) => i + 1);
    }
  };

  // ── Export / download ─────────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (timelineClips.length === 0 || isExporting) return;
    setIsExporting(true);
    showToast(
      timelineClips.length === 1
        ? "Downloading clip..."
        : `Downloading ${timelineClips.length} clips...`
    );

    for (let i = 0; i < timelineClips.length; i++) {
      const clip = timelineClips[i];
      const a = document.createElement("a");
      a.href = clip.url;
      a.download = clip.name.endsWith(".mp4") ? clip.name : `${clip.name}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay between downloads so browser doesn't block them
      if (i < timelineClips.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setIsExporting(false);
  }, [timelineClips, isExporting]);

  // ── Total timeline duration ───────────────────────────────────────────────────
  const totalDuration = timelineClips.reduce((s, c) => s + c.duration, 0);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ backgroundColor: "#0d0d14" }}
    >
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0"
          >
            <span className="text-white text-sm font-bold">C</span>
          </Link>
          <span className="text-sm font-semibold text-white">Editor</span>
          <span className="text-surface-border">|</span>
          <Link href="/app" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Back to App
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <button
            onClick={shuffleTimeline}
            disabled={timelineClips.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-sm text-gray-300 hover:border-accent/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            Shuffle
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={timelineClips.length === 0 || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            )}
            {isExporting ? "Downloading..." : "Export"}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Library Sidebar ── */}
        <aside className="shrink-0 w-60 flex flex-col border-r border-surface-border overflow-hidden">
          {/* Library header */}
          <div className="shrink-0 px-3 pt-3 pb-2 border-b border-surface-border/50">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Library</p>
            <div className="flex flex-col gap-1.5">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs text-gray-300 hover:border-accent/40 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-accent">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload Clips
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              {/* Import from Clippr */}
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-surface-border text-xs text-gray-300 hover:border-accent/40 hover:text-white disabled:opacity-50 transition-colors"
              >
                {isImporting ? (
                  <svg className="w-3.5 h-3.5 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-accent">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                  </svg>
                )}
                Import from Clippr
              </button>
            </div>
          </div>

          {/* Clip list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
            {libraryClips.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-surface-border/50 rounded-xl mx-1 text-center px-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-gray-700 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-[11px] text-gray-600">Upload or drop video files here</p>
              </div>
            ) : (
              libraryClips.map((clip) => (
                <LibraryCard
                  key={clip.id}
                  clip={clip}
                  onAddToTimeline={addToTimeline}
                  onDragStart={setLibraryDragClip}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Preview Panel ── */}
        <main className="flex-1 flex flex-col items-center justify-center bg-black/30 min-w-0 relative">
          {activeClip ? (
            <>
              <video
                ref={videoRef}
                controls
                onEnded={handleVideoEnded}
                className="max-w-full max-h-full rounded-xl shadow-2xl"
                style={{ maxHeight: "calc(100% - 32px)" }}
              />
              <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-gray-600">
                Clip {activeIndex + 1} of {timelineClips.length} &middot; {activeClip.name}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 text-gray-800">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-.125C2.25 17.338 2.25 16.5 2.25 15.75m0 0h.75m-.75 0H2.25m0 0V8.25m0 0c0-1.657 1.343-3 3-3h13.5c1.657 0 3 1.343 3 3v7.5M6 18.375V8.625M6 18.375H18m0 0V8.625M18 8.625H6" />
              </svg>
              <p className="text-sm text-gray-600">Add clips to the timeline to preview</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Timeline ── */}
      <div className="shrink-0 h-40 border-t border-surface-border flex flex-col" style={{ backgroundColor: "#0a0a12" }}>
        {/* Timeline header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-b border-surface-border/40">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Timeline</p>
            {timelineClips.length > 0 && (
              <span className="text-[10px] text-gray-600">
                {timelineClips.length} clip{timelineClips.length !== 1 ? "s" : ""} &middot; {formatTime(totalDuration)} total
              </span>
            )}
          </div>
          {timelineClips.length > 0 && (
            <button
              onClick={() => { setTimelineClips([]); setActiveIndex(0); }}
              className="text-[10px] text-gray-600 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Timeline track */}
        <div
          className={`flex-1 overflow-x-auto overflow-y-hidden px-3 py-2 transition-colors ${
            dragOverTimeline ? "bg-accent/5" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTimeline(true);
          }}
          onDragLeave={() => {
            setDragOverTimeline(false);
          }}
          onDrop={handleTimelineDrop}
        >
          {timelineClips.length === 0 ? (
            <div
              className={`h-full flex items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
                dragOverTimeline ? "border-accent/60 bg-accent/5" : "border-surface-border/40"
              }`}
            >
              <p className="text-xs text-gray-600">Drag clips here or click + in the library</p>
            </div>
          ) : (
            <div className="flex gap-2 h-full items-center">
              {timelineClips.map((clip, index) => {
                const tileWidth = Math.max(80, clip.duration * 8);
                const isActive = index === activeIndex;
                const isDragOver = timelineDragOverIndex === index;

                return (
                  <div
                    key={clip.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setTimelineDragIndex(index);
                      setLibraryDragClip(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimelineDragOverIndex(index);
                    }}
                    onDragLeave={() => setTimelineDragOverIndex(null)}
                    onClick={() => setActiveIndex(index)}
                    className={`relative shrink-0 h-[88px] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isActive
                        ? "border-accent shadow-[0_0_12px_2px_rgba(124,58,237,0.4)]"
                        : isDragOver
                        ? "border-accent/50 scale-[1.02]"
                        : "border-surface-border/60 hover:border-surface-border"
                    }`}
                    style={{ width: tileWidth }}
                  >
                    {/* Thumbnail bg */}
                    {clip.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={clip.thumbnail}
                        alt={clip.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-surface-hover" />
                    )}

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
                    )}

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromTimeline(index);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100 z-10"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Label */}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1">
                      <p className="text-[9px] text-white font-medium truncate">{clip.name}</p>
                      <p className="text-[8px] text-gray-400">{formatTime(clip.duration)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Drop hint at end */}
              <div
                className={`shrink-0 w-16 h-[88px] rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${
                  dragOverTimeline ? "border-accent/40" : "border-surface-border/30"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#1a1a2e] border border-surface-border text-sm text-white shadow-xl z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
