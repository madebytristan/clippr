import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptEntry, Section } from "./types";
import { formatTranscriptForClaude } from "./transcript";
import { formatTime } from "./utils";

const client = new Anthropic();

export async function detectSections(
  transcript: TranscriptEntry[],
  videoDuration: number
): Promise<Section[]> {
  if (transcript.length === 0) {
    throw new Error("Transcript is empty — cannot detect sections.");
  }

  const transcriptText = formatTranscriptForClaude(transcript);
  const durationStr = formatTime(videoDuration);

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are analyzing a YouTube video transcript to identify distinct, clip-worthy sections.

Video duration: ${durationStr}

Transcript (format: [MM:SS] text):
${transcriptText}

Identify between 3 and 10 distinct sections or topic segments in this video. Guidelines:
- Each section should be at least 30 seconds long
- Sections must not overlap
- Sections should cover the entire video (from 0 to ${videoDuration} seconds)
- Give each section a concise, descriptive title (max 60 chars)
- Write a 1–2 sentence summary of what happens in each section
- Use the timestamps from the transcript to set start/end times

Respond with ONLY valid JSON, no markdown fences, no explanation:
{
  "sections": [
    {
      "title": "string",
      "summary": "string",
      "startTime": <number in seconds>,
      "endTime": <number in seconds>
    }
  ]
}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude.");
  }

  let parsed: { sections: Array<{ title: string; summary: string; startTime: number; endTime: number }> };
  try {
    parsed = JSON.parse(block.text);
  } catch {
    throw new Error("Claude returned invalid JSON. Try again.");
  }

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("Claude returned no sections.");
  }

  return parsed.sections.map((s, i) => ({
    id: `section-${i}`,
    title: s.title,
    summary: s.summary,
    startTime: Math.max(0, Math.round(s.startTime)),
    endTime: Math.min(videoDuration, Math.round(s.endTime)),
  }));
}
