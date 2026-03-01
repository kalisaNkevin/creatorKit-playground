import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import type { Segment } from "./transcribe";

const ClipSchema = z.object({
  clips: z
    .array(
      z.object({
        title: z.string().describe("Catchy, punchy title for the short clip"),
        startTime: z
          .number()
          .describe("Clip start time in seconds (match a segment boundary)"),
        endTime: z
          .number()
          .describe(
            "Clip end time in seconds, ideally 60-90s after start time"
          ),
        hook: z
          .string()
          .describe(
            "Opening sentence that grabs attention in the first 3 seconds"
          ),
        category: z
          .string()
          .describe(
            'Content category — must be one of: insight, story, controversial, funny, actionable, prediction'
          ),
        reason: z
          .string()
          .describe("Why this clip will perform well on social media"),
        estimatedViralScore: z
          .number()
          .min(1)
          .max(10)
          .describe("Estimated viral potential score"),
      })
    )
    .length(5)
    .describe("Exactly 5 best clips for short-form content"),
});

export type Clip = z.infer<typeof ClipSchema>["clips"][number];


export async function selectClips(
  segments: Segment[],
  podcastTitle: string
): Promise<Clip[]> {
  const transcript = segments
    .map((s) => `[${formatTime(s.start)}–${formatTime(s.end)}] ${s.text}`)
    .join("\n");

  const { object } = await generateObject({
    model: groq("openai/gpt-oss-20b"),
    schema: ClipSchema,
    prompt: `You are an expert social media content editor who specializes in creating viral short-form clips from long-form podcasts.

Podcast: "${podcastTitle}"

Analyze the transcript below and select exactly 5 clips that will perform best as YouTube Shorts, TikToks, or Instagram Reels (60–90 seconds each).

Prioritize clips that contain:
- Surprising or counterintuitive statements
- Strong emotional peaks (excitement, frustration, humor)
- Quotable, punchy insights that stand alone without context
- Specific predictions about the future
- Personal stories or vulnerable moments
- Controversial opinions that spark debate

Each clip must start and end at natural conversation breaks (don't cut mid-sentence).

Transcript:
${transcript}

Return exactly 5 clips with precise timestamps matching the transcript.`,
  });

  // Sort by viral score descending
  return object.clips.sort(
    (a, b) => b.estimatedViralScore - a.estimatedViralScore
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
