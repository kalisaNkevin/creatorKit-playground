import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { $ } from "bun";

export type Segment = {
  start: number;
  end: number;
  text: string;
};

const CHUNK_SIZE_MB = 24; // Whisper API limit is 25 MB
const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024;

// Priority: Groq (free API) → OpenAI API → local whisper CLI
type TranscriberMode = "groq" | "openai" | "local";

export function resolveTranscriberMode(): TranscriberMode | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (Bun.spawnSync(["which", "whisper"]).exitCode === 0) return "local";
  return null;
}

function makeClient(mode: "groq" | "openai"): OpenAI {
  if (mode === "groq") {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return new OpenAI(); // uses OPENAI_API_KEY
}

/**
 * Transcribes audio using whichever provider is available:
 *   1. Groq API  (GROQ_API_KEY)
 *   2. OpenAI API (OPENAI_API_KEY)
 *   3. Local whisper CLI  (pip install openai-whisper)
 */
export async function transcribe(
  audioPath: string,
  cacheDir: string
): Promise<Segment[]> {
  const cachePath = path.join(cacheDir, "transcript.json");

  if (fs.existsSync(cachePath)) {
    console.log("   Using cached transcript.");
    return JSON.parse(fs.readFileSync(cachePath, "utf-8")) as Segment[];
  }

  const mode = resolveTranscriberMode();
  if (!mode) throw new Error("No transcription provider available.");

  let segments: Segment[];

  if (mode === "local") {
    segments = await transcribeLocal(audioPath, cacheDir);
  } else {
    const client = makeClient(mode);
    const fileSize = fs.statSync(audioPath).size;

    if (fileSize <= CHUNK_SIZE_BYTES) {
      segments = await transcribeFile(client, audioPath);
    } else {
      console.log(
        `   File is ${(fileSize / 1024 / 1024).toFixed(0)} MB, splitting into chunks...`
      );
      segments = await transcribeInChunks(client, audioPath, cacheDir);
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(segments, null, 2));
  return segments;
}

// ── API path ──────────────────────────────────────────────────────────────────

async function transcribeFile(
  openai: OpenAI,
  audioPath: string
): Promise<Segment[]> {
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  return (response.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));
}

async function transcribeInChunks(
  openai: OpenAI,
  audioPath: string,
  workDir: string
): Promise<Segment[]> {
  const chunksDir = path.join(workDir, "chunks");
  fs.mkdirSync(chunksDir, { recursive: true });

  const result =
    await $`ffprobe -v error -show_entries format=duration -of csv=p=0 ${audioPath}`.text();
  const totalDuration = parseFloat(result.trim());

  const chunkSeconds = 600;
  const numChunks = Math.ceil(totalDuration / chunkSeconds);
  const allSegments: Segment[] = [];
  let timeOffset = 0;

  for (let i = 0; i < numChunks; i++) {
    const chunkPath = path.join(chunksDir, `chunk-${i}.mp3`);
    await $`ffmpeg -y -i ${audioPath} -ss ${i * chunkSeconds} -t ${chunkSeconds} -acodec copy ${chunkPath}`;

    console.log(`   Transcribing chunk ${i + 1}/${numChunks}...`);
    for (const seg of await transcribeFile(openai, chunkPath)) {
      allSegments.push({ ...seg, start: seg.start + timeOffset, end: seg.end + timeOffset });
    }
    timeOffset += chunkSeconds;
  }

  return allSegments;
}

// ── Local path ────────────────────────────────────────────────────────────────

async function transcribeLocal(
  audioPath: string,
  cacheDir: string
): Promise<Segment[]> {
  // WHISPER_MODEL env var overrides the default.
  // Smaller = faster but less accurate: tiny < base < small < medium < large
  const model = process.env.WHISPER_MODEL ?? "base";
  const basename = path.basename(audioPath, path.extname(audioPath));
  const jsonPath = path.join(cacheDir, `${basename}.json`);

  console.log(`   Model: ${model}  (override with WHISPER_MODEL=small|medium|large)`);
  console.log(`   First run downloads the model weights (~${modelSize(model)}) — cached after that.`);

  await $`whisper ${audioPath} \
    --model ${model} \
    --output_format json \
    --language en \
    --output_dir ${cacheDir}`;

  type WhisperSegment = { start: number; end: number; text: string };
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as {
    segments: WhisperSegment[];
  };

  return (data.segments ?? []).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));
}

function modelSize(model: string): string {
  const sizes: Record<string, string> = {
    tiny: "75 MB", "tiny.en": "75 MB",
    base: "145 MB", "base.en": "145 MB",
    small: "461 MB", "small.en": "461 MB",
    medium: "1.5 GB", "medium.en": "1.5 GB",
    large: "2.9 GB", "large-v2": "2.9 GB", "large-v3": "2.9 GB",
  };
  return sizes[model] ?? "unknown size";
}
