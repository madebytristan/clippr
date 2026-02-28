"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClerkSignUpCTA, ClerkHeroCTA } from "@/components/ClerkAuthArea";
import AppShell from "@/components/AppShell";


// ── Gallery data — add images to /public/gallery/ and list them here ──────────

// Add entries here after uploading via the gallery card, or drop files into /public/gallery/
const GALLERY_IMAGES: { src: string; alt: string; views: string; revenue: string }[] = [];

// ── GalleryCard ───────────────────────────────────────────────────────────────

function GalleryCard({
  src,
  alt,
  views,
  revenue,
}: {
  src: string;
  alt: string;
  views: string;
  revenue: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Silently hide if image fails to load
  if (errored) return null;

  return (
    <div className="shrink-0 w-[480px] h-[240px] rounded-2xl overflow-hidden border border-surface-border/60 bg-[#0b0b16] relative">
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-surface-hover animate-pulse" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover object-top block ${loaded ? "" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      {/* Stat overlay */}
      {loaded && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center px-4 py-2.5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-1.5">
            {/* YouTube logo */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#ff0000]">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-white text-xs font-semibold tabular-nums">{views} views</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GalleryUploadCard ─────────────────────────────────────────────────────────

function GalleryUploadCard({ onUploaded }: { onUploaded: (path: string, views: string, revenue: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      const res = await fetch("/api/gallery/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        onUploaded(data.path, "—", "—");
      }
    }
    setUploading(false);
  }, [onUploaded]);

  return (
    <div
      className="shrink-0 w-[240px] h-[200px] rounded-2xl border-2 border-dashed border-surface-border flex flex-col items-center justify-center gap-2 text-gray-600 hover:border-accent/40 hover:text-gray-400 transition-colors cursor-pointer group"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 group-hover:text-accent-light transition-colors">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-xs font-medium">Add screenshot</span>
          <span className="text-[10px] text-gray-700 text-center px-4">Click or drag & drop an image</span>
        </>
      )}
    </div>
  );
}

// ── Feature grid data ─────────────────────────────────────────────────────────

interface Feature {
  id: string;
  label: string;
  badge?: "New" | "Free" | "Coming";
  icon: React.ReactNode;
  href: string;
}

const ROW1: Feature[] = [
  {
    id: "clipping",
    label: "AI Clipping",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.499-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
      </svg>
    ),
  },
  {
    id: "moments",
    label: "Find Moments",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    id: "sections",
    label: "AI Sections",
    badge: "New",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    id: "editor",
    label: "Video Editor",
    badge: "Coming",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    id: "summary",
    label: "Video Summary",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    id: "transcript",
    label: "Transcripts",
    badge: "Free",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
];

const ROW2: Feature[] = [
  {
    id: "subtitles",
    label: "AI Subtitles",
    badge: "Free",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  },
  {
    id: "reframe",
    label: "AI Reframe",
    badge: "Free",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "broll",
    label: "B-roll",
    badge: "Coming",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
      </svg>
    ),
  },
  {
    id: "hook",
    label: "AI Hook",
    badge: "Coming",
    href: "/app",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
];

const GALLERY_FILTERS = ["All", "AI Clipping", "Find Moments", "Video Summary", "Transcripts", "AI Reframe"];

const SAMPLE_CLIPS = [
  {
    id: 1,
    title: "Lex Fridman & Sam Altman on AGI Timeline",
    label: "AI Clipping",
    duration: "0:40",
    gradient: "from-violet-950 via-purple-900 to-indigo-950",
    caption: "Sam Altman on why AGI may arrive sooner than anyone expects...",
  },
  {
    id: 2,
    title: "MrBeast's Secret to 300M Subscribers",
    label: "Find Moments",
    duration: "0:26",
    gradient: "from-indigo-950 via-violet-900 to-purple-950",
    caption: "The single biggest thing I did differently from everyone else...",
  },
  {
    id: 3,
    title: "Joe Rogan & Elon Musk: The Future of AI",
    label: "Video Summary",
    duration: "2:28:14",
    gradient: "from-purple-950 via-fuchsia-950 to-violet-900",
    caption: "Full 3-hour conversation summarized in 5 key moments",
  },
  {
    id: 4,
    title: "Steve Jobs: Secrets of Innovation at Apple",
    label: "Transcripts",
    duration: "0:13:01",
    gradient: "from-slate-900 via-purple-950 to-violet-900",
    caption: "The people who are crazy enough to think they can change the world...",
  },
];

// ── Badge color helper ────────────────────────────────────────────────────────

function badgeColor(badge: Feature["badge"]) {
  if (badge === "Free") return "text-accent-light";
  if (badge === "Coming") return "text-gray-500";
  return "text-accent-light"; // New
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [galleryImages, setGalleryImages] = useState(GALLERY_IMAGES);
  const router = useRouter();

  // Seed gallery from disk on mount so images persist after refresh
  useEffect(() => {
    fetch("/api/gallery/list")
      .then((r) => r.json())
      .then(({ images }) => {
        if (images && images.length > 0) setGalleryImages(images);
      })
      .catch(() => {});
  }, []);

  const handleGalleryUpload = useCallback((path: string, views: string, revenue: string) => {
    setGalleryImages((prev) => [...prev, { src: path, alt: path, views, revenue }]);
  }, []);

  function handleGo() {
    if (!inputUrl.trim()) return;
    router.push(`/app?url=${encodeURIComponent(inputUrl.trim())}`);
  }

  const filteredClips =
    activeFilter === "All"
      ? SAMPLE_CLIPS
      : SAMPLE_CLIPS.filter((c) => c.label === activeFilter);

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">

          {/* ── Hero ── */}
          <section className="flex flex-col items-center pt-14 pb-10 px-6">

            {/* Social proof bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="#f59e0b" className="w-4 h-4">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">6 Figures+ Ad Revenue Generated Using Our Clips</span>
            </div>

            {/* Headline */}
            <div className="text-center leading-tight">
              <h1 className="text-5xl sm:text-6xl font-bold text-white">
                The{" "}
                <span
                  className="inline-block px-4 py-1 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    boxShadow: "0 0 32px 8px rgba(124, 58, 237, 0.45), 0 0 64px 16px rgba(109, 40, 217, 0.2)",
                  }}
                >
                  #1 Longform Clipping Tool
                </span>
              </h1>
              <h1 className="text-5xl sm:text-6xl font-bold text-white mt-2">
                Create Viral Videos With AI
              </h1>
            </div>

            <p className="text-gray-400 text-base mt-4 text-center max-w-lg">Your all-in-one tool for AI clipping, viral moments, subtitles, and more.</p>

            {/* URL input bar */}
            <div className="mt-8 w-full max-w-xl flex items-center gap-2 rounded-full border border-accent/50 bg-surface-card px-4 py-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGo()}
                placeholder="Paste a YouTube link to generate AI clips"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
              />
              <button
                onClick={handleGo}
                className="shrink-0 w-8 h-8 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            {/* Quick action chips */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button onClick={() => router.push("/app")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-border text-xs text-gray-400 hover:border-accent-muted hover:text-gray-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload
              </button>
              <button
                onClick={() => {
                  const demo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
                  setInputUrl(demo);
                  router.push(`/app?url=${encodeURIComponent(demo)}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-border text-xs text-gray-400 hover:border-accent-muted hover:text-gray-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.47 12.08 12.08 0 00-7.64 0 4.83 4.83 0 01-3.77 2.47 12 12 0 000 10.62 4.83 4.83 0 013.77 2.47 12.08 12.08 0 007.64 0 4.83 4.83 0 013.77-2.47 12 12 0 000-10.62zM10 14.65V9.35l5 2.65z" />
                </svg>
                YouTube Video Link
              </button>
              <button onClick={() => router.push("/app")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-border text-xs text-gray-400 hover:border-accent-muted hover:text-gray-200">
                + Other Links
              </button>
            </div>

            {/* Auth CTAs */}
            <div className="mt-6">
              <ClerkHeroCTA />
            </div>
          </section>

          {/* ── Feature grid ── */}
          <section className="px-6 pb-8 max-w-4xl mx-auto w-full">
            {/* Row 1 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {ROW1.map((f) => (
                <FeatureCard key={f.id} feature={f} />
              ))}
            </div>
            {/* Row 2 */}
            <div className="mt-3 flex justify-center gap-3">
              {ROW2.map((f) => (
                <FeatureCard key={f.id} feature={f} className="w-[calc(16.666%-10px)] min-w-[80px]" />
              ))}
            </div>
          </section>

          {/* ── How It Works ── */}
          <section className="px-6 pb-12 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white text-xl font-bold">Workflows To Go Viral</h2>
                <p className="text-gray-500 text-sm mt-0.5">Example: See how to generate a clipped highlight reel</p>
              </div>
              <ClerkSignUpCTA className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Step 1 */}
              <div className="rounded-2xl border border-surface-border bg-[#0f0f1a] overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                  <span className="text-[11px] font-black tracking-widest text-accent-light uppercase">STEP 1</span>
                </div>
                <div className="h-44 bg-[#0b0b16] flex flex-col items-center justify-center relative overflow-hidden border-y border-surface-border gap-3">
                  {/* Dashed border bg hint */}
                  <div className="absolute inset-4 rounded-xl border border-dashed border-surface-border/40 pointer-events-none" />
                  {/* Horizontal → vertical clip row */}
                  <div className="flex items-center gap-0 z-10">
                    {/* Horizontal (landscape) rect */}
                    <div className="w-[72px] h-[46px] rounded-lg border border-surface-border bg-gradient-to-br from-slate-800/80 to-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent" />
                      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 opacity-50 z-10">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <span className="absolute bottom-0.5 right-1 text-[7px] text-white/30 z-10">16:9</span>
                    </div>
                    {/* Dotted arrow */}
                    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="shrink-0">
                      <line x1="1" y1="10" x2="34" y2="10" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
                      <polyline points="28,5 36,10 28,15" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Vertical (portrait) rect */}
                    <div className="w-[40px] h-[64px] rounded-lg bg-gradient-to-br from-violet-900 to-purple-950 border border-accent/40 flex items-center justify-center relative overflow-hidden shrink-0">
                      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 opacity-60">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <span className="absolute bottom-0.5 text-center w-full text-[7px] text-white/30">9:16</span>
                    </div>
                  </div>
                  {/* Upload hint */}
                  <div className="flex items-center gap-2 z-10">
                    <span className="text-[10px] text-gray-600">drag &amp; drop or</span>
                    <div className="px-2.5 py-0.5 rounded border border-surface-border text-[10px] text-gray-400 bg-surface-hover">Browse File</div>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-white font-semibold text-sm block mb-1">Upload your video</span>
                  <p className="text-gray-500 text-xs">Use any file, or a YouTube link.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-surface-border bg-[#0f0f1a] overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                  <span className="text-[11px] font-black tracking-widest text-accent-light uppercase">STEP 2</span>
                </div>
                <div className="h-44 bg-[#0b0b16] flex items-center justify-center border-y border-surface-border px-4 py-3">
                  <div className="flex flex-col gap-2.5 w-full">
                    {[
                      { label: "Funny", icon: "😂", color: "from-yellow-900/50 to-amber-900/40", border: "border-yellow-700/30", text: "text-yellow-200", active: false },
                      { label: "Viral", icon: "🔥", color: "from-violet-800 to-purple-900", border: "border-accent/50", text: "text-white", active: true },
                      { label: "Intense", icon: "⚡", color: "from-red-950 to-rose-900/70", border: "border-red-700/30", text: "text-red-200", active: false },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={`w-full rounded-xl bg-gradient-to-r ${s.color} border ${s.border} flex items-center gap-3 px-4 py-2.5 ${s.active ? "ring-1 ring-accent/60 shadow-[0_0_12px_2px_rgba(124,58,237,0.25)]" : ""}`}
                      >
                        <span className="text-base leading-none">{s.icon}</span>
                        <span className={`text-sm font-bold tracking-wide ${s.text}`}>{s.label}</span>
                        {s.active && (
                          <span className="ml-auto text-[10px] font-semibold text-accent-light bg-accent/20 rounded-full px-2 py-0.5">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-white font-semibold text-sm block mb-1">Select clipping style</span>
                  <p className="text-gray-500 text-xs">Choose from AI-powered clip styles.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-surface-border bg-[#0f0f1a] overflow-hidden">
                <div className="px-4 pt-3 pb-2">
                  <span className="text-[11px] font-black tracking-widest text-accent-light uppercase">STEP 3</span>
                </div>
                <div className="h-44 bg-[#0b0b16] flex flex-col items-center justify-center border-y border-surface-border relative overflow-hidden gap-3">
                  {/* Horizontal → vertical row with spinner on output */}
                  <div className="flex items-center gap-0 z-10">
                    {/* Horizontal (landscape) source rect */}
                    <div className="w-[72px] h-[46px] rounded-lg border border-surface-border bg-gradient-to-br from-slate-800/80 to-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-transparent" />
                      <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 opacity-50 z-10">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <span className="absolute bottom-0.5 right-1 text-[7px] text-white/30 z-10">16:9</span>
                    </div>
                    {/* Dotted arrow */}
                    <svg width="44" height="20" viewBox="0 0 44 20" fill="none" className="shrink-0">
                      <line x1="1" y1="10" x2="34" y2="10" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
                      <polyline points="28,5 36,10 28,15" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Vertical (portrait) output rect with spinner overlay */}
                    <div className="w-[40px] h-[64px] rounded-lg bg-gradient-to-br from-violet-900 to-purple-950 border border-accent/40 flex items-center justify-center relative overflow-hidden shrink-0">
                      {/* Spinner ring overlay */}
                      <svg viewBox="0 0 40 40" className="w-8 h-8 -rotate-90 absolute">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#1e1e30" strokeWidth="3" />
                        <circle cx="20" cy="20" r="16" fill="none" stroke="#a78bfa" strokeWidth="3"
                          strokeDasharray="100" strokeDashoffset="25" strokeLinecap="round" />
                      </svg>
                      <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3 opacity-70 z-10">
                        <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <span className="absolute bottom-0.5 text-center w-full text-[7px] text-white/30">9:16</span>
                    </div>
                  </div>
                  {/* Generating label */}
                  <div className="flex flex-col items-center gap-0.5 z-10">
                    <span className="text-[11px] text-gray-400 font-medium">Generating clip…</span>
                    <span className="text-[10px] text-gray-600">Takes about 30s</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-white font-semibold text-sm block mb-1">Generate video</span>
                  <p className="text-gray-500 text-xs">Watch it generate viral clips in seconds.</p>
                </div>
              </div>

            </div>
          </section>

          {/* ── Gallery ── */}
          <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-accent-light text-lg">✦</span>
              <h2 className="text-white font-semibold text-base">Created with Clippr</h2>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5">
              {GALLERY_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeFilter === f
                      ? "bg-accent border-accent text-white"
                      : "border-surface-border text-gray-400 hover:border-accent-muted hover:text-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Video grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredClips.map((clip) => (
                <Link key={clip.id} href="/app" className="group rounded-xl overflow-hidden border border-surface-border hover:border-accent/40 bg-surface-card block">
                  <div className={`aspect-video bg-gradient-to-br ${clip.gradient} relative`}>
                    <span className="absolute top-2 left-2 text-xs bg-accent/80 text-white rounded px-1.5 py-0.5 font-medium">
                      {clip.label}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs leading-tight line-clamp-2">{clip.caption}</p>
                    </div>
                    <span className="absolute bottom-2 right-2 text-xs text-white/80 bg-black/50 rounded px-1">
                      {clip.duration}
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white">{clip.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── YouTube Results Gallery ── */}
          <section className="pb-16 w-full">
            <div className="max-w-4xl mx-auto px-6 mb-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-accent-light uppercase tracking-widest mb-2">Real results</p>
                  <h2 className="text-white text-2xl font-bold leading-tight">
                    YouTube Videos Created With Clippr
                  </h2>
                  <p className="text-gray-500 text-sm mt-1.5">
                    Analytics from videos our creators clipped and published.
                  </p>
                </div>
                {/* Aggregate stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0 pb-1">
                  <div className="text-right">
                    <p className="text-xl font-bold text-white tabular-nums">30.1M+</p>
                    <p className="text-xs text-gray-500">Views generated</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white tabular-nums">$100k+</p>
                    <p className="text-xs text-gray-500">Revenue earned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal scrolling image rail */}
            <div
              className="flex gap-4 overflow-x-auto pl-6 pr-6 pb-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {galleryImages.map((img, i) => (
                <GalleryCard key={i} src={img.src} alt={img.alt} views={img.views} revenue={img.revenue} />
              ))}
              <GalleryUploadCard onUploaded={handleGalleryUpload} />
            </div>
          </section>

          {/* ── Reviews ── */}
          <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="#f59e0b" className="w-5 h-5">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Loved by creators</h2>
              <p className="text-gray-500 text-sm max-w-sm">Thousands of creators use Clippr to grow their channels and generate ad revenue.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  name: "Alex R.",
                  role: "YouTube Creator",
                  avatar: "A",
                  text: "Clippr literally changed how I repurpose content. I used to spend hours cutting clips — now it's done in under a minute. The AI finds moments I would've missed.",
                  stars: 5,
                },
                {
                  name: "Mia T.",
                  role: "Content Strategist",
                  avatar: "M",
                  text: "The Viral mode is insane. I uploaded a 2-hour podcast and got 8 clips that each hit over 100k views. Best tool I've added to my stack this year.",
                  stars: 5,
                },
                {
                  name: "Jordan K.",
                  role: "Short-Form Creator",
                  avatar: "J",
                  text: "Skeptical at first but the transcript-based section detection is legitimately impressive. It understands context, not just silence or pauses.",
                  stars: 5,
                },
              ].map((r) => (
                <div key={r.name} className="rounded-2xl border border-surface-border bg-[#0f0f1a] p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(r.stars)].map((_, i) => (
                      <svg key={i} viewBox="0 0 20 20" fill="#f59e0b" className="w-3.5 h-3.5">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1">"{r.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-muted flex items-center justify-center text-accent-light font-bold text-sm shrink-0">
                      {r.avatar}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{r.name}</div>
                      <div className="text-gray-500 text-xs">{r.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

      </main>
    </AppShell>
  );
}

// ── FeatureCard ───────────────────────────────────────────────────────────────

function FeatureCard({ feature, className = "" }: { feature: Feature; className?: string }) {
  return (
    <Link
      href={feature.href}
      className={`relative flex flex-col items-center justify-center gap-2 p-3 pt-4 pb-3 rounded-xl bg-surface-card border border-surface-border hover:border-accent/40 hover:bg-surface-hover cursor-pointer group ${className}`}
    >
      {feature.badge && (
        <span className={`absolute top-1.5 right-2 text-[10px] font-semibold ${badgeColor(feature.badge)}`}>
          {feature.badge}
        </span>
      )}
      <div className="text-gray-300 group-hover:text-accent-light">
        {feature.icon}
      </div>
      <span className="text-xs text-gray-400 group-hover:text-gray-200 text-center leading-tight">
        {feature.label}
      </span>
    </Link>
  );
}
