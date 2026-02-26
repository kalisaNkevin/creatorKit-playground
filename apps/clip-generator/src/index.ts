import { extractAudio } from "./extract-audio";
import { transcribe, resolveTranscriberMode } from "./transcribe";
import { selectClips } from "./select-clips";
import { generateClips } from "./generate";
import fs from "fs";
import path from "path";

// ── Input ─────────────────────────────────────────────────────────────────────
const videoPath = process.argv[2];

// ── Output dirs ───────────────────────────────────────────────────────────────
const ROOT = path.join(import.meta.dir, "..", "output");
const RAW_DIR = path.join(ROOT, "raw");
const CLIPS_DIR = path.join(ROOT, "clips");

// ── Helpers ───────────────────────────────────────────────────────────────────
function banner(step: string, icon: string) {
  console.log(`\n${icon}  ${step}`);
  console.log("─".repeat(50));
}

function checkInput() {
  if (!videoPath) {
    console.error("Usage: bun run start <path-to-video>");
    console.error("Example: bun run start ~/Downloads/podcast.mp4");
    process.exit(1);
  }
  if (!fs.existsSync(videoPath)) {
    console.error(`File not found: ${videoPath}`);
    process.exit(1);
  }
}

function checkDeps() {
  const missing: string[] = [];
  for (const bin of ["ffmpeg", "ffprobe"]) {
    if (Bun.spawnSync(["which", bin]).exitCode !== 0) missing.push(bin);
  }
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");

  const transcriberMode = resolveTranscriberMode();
  if (!transcriberMode) {
    missing.push(
      "transcription provider — run:  pip install openai-whisper\n" +
      "    (or set GROQ_API_KEY / OPENAI_API_KEY for a cloud API)"
    );
  }

  if (missing.length > 0) {
    console.error("\nMissing:");
    for (const dep of missing) console.error(`  • ${dep}`);
    process.exit(1);
  }

  const transcriberLabel: Record<string, string> = {
    groq:  "Groq API (free)",
    openai: "OpenAI API",
    local: "local whisper CLI  (offline)",
  };
  console.log(`\nProviders:`);
  console.log(`  Clip selection → Claude Opus 4.6`);
  console.log(`  Transcription  → ${transcriberLabel[transcriberMode!]}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  checkInput();

  const title = path.basename(videoPath!, path.extname(videoPath!));

  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║        🎙  CreatorKit Clip Generator               ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`\nFile  : ${videoPath}`);
  console.log(`Title : ${title}`);

  checkDeps();

  // 1. Extract audio for Whisper ─────────────────────────────────────────────
  banner("Extracting audio for transcription", "🎵");
  const audioFile = await extractAudio(videoPath!, RAW_DIR);

  // 2. Transcribe ────────────────────────────────────────────────────────────
  banner("Transcribing with Whisper", "📝");
  const segments = await transcribe(audioFile, RAW_DIR);
  console.log(`   ${segments.length} segments transcribed`);

  // 3. Select clips ──────────────────────────────────────────────────────────
  banner("Selecting best clips with Vercel AI SDK", "🤖");
  const clips = await selectClips(segments, title);

  fs.mkdirSync(ROOT, { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, "clips.json"),
    JSON.stringify(clips, null, 2)
  );
  console.log(`   Saved clip metadata → output/clips.json`);

  // 4. Cut video clips ───────────────────────────────────────────────────────
  banner("Cutting video clips with ffmpeg", "✂");
  const generated = await generateClips(videoPath!, clips, CLIPS_DIR);

  // 5. Summary ───────────────────────────────────────────────────────────────
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log(`║  ✅  Done! Generated ${generated.length} clips                    ║`);
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`\nOutput: ${CLIPS_DIR}\n`);

  for (const clip of generated) {
    const duration = clip.endTime - clip.startTime;
    console.log(`  🔥 ${clip.estimatedViralScore}/10  "${clip.title}"`);
    console.log(
      `     ${formatTime(clip.startTime)} → ${formatTime(clip.endTime)}  (${Math.round(duration)}s)`
    );
    console.log(`     ${path.basename(clip.outputPath)}\n`);
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
