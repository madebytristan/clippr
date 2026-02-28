# Clippr

YouTube auto-clipper: paste a URL, get a transcript, auto-detect sections with AI, and download each section as a 1080p clip with optional aspect ratio reframing.

## Features

- Fetch video info and transcript from any YouTube URL
- AI-powered section detection (Claude) — identifies natural topic breaks
- Download the full video at 1080p via yt-dlp
- Clip each section individually using ffmpeg
- Reframe to any aspect ratio: **16:9**, **9:16**, **1:1**, **4:5** with left/center/right crop positioning

## Local Development

### Prerequisites

- Node.js 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp): `pip install yt-dlp`
- ffmpeg: `apt install ffmpeg` / `brew install ffmpeg` / [Windows builds](https://ffmpeg.org/download.html)

### Setup

```bash
cp .env.example .env.local
# Add your Anthropic API key to .env.local

npm install
npm run dev
```

Open http://localhost:3000

## Docker (recommended for production)

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY

docker compose up --build
```

App runs on http://localhost:3000. Video files are stored in the `clippr_data` Docker volume.

## Cloud Deployment

Deploy to any container-based platform that supports custom Dockerfiles with long-running processes:

- **Railway**: Connect your repo → Railway auto-detects the Dockerfile. Set `ANTHROPIC_API_KEY` in environment variables.
- **Render**: Create a new Web Service → Docker → set env vars.
- **Fly.io**: `fly launch` → `fly secrets set ANTHROPIC_API_KEY=...` → `fly deploy`

> **Note**: Do **not** deploy to Vercel — video downloading and ffmpeg processing require long-running server processes, which are not supported on serverless platforms.

## How It Works

1. **Video Info** — yt-dlp fetches title, duration, thumbnail without downloading
2. **Transcript** — `youtube-transcript` fetches YouTube's captions
3. **Section Detection** — transcript is sent to Claude, which identifies natural topic breaks and returns JSON with titles, summaries, and timestamps
4. **Download** — yt-dlp downloads the video at up to 1080p (streams SSE progress to the browser)
5. **Clip Generation** — ffmpeg cuts the source video by timestamp and optionally applies a crop filter for the selected aspect ratio
6. **Download** — clips are served directly from the server's temp directory

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | For AI section detection |
| `CLIPPR_TEMP_DIR` | No | Override default temp dir (default: `/tmp/clippr`) |
