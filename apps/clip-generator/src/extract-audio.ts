import { $ } from "bun";
import path from "path";
import fs from "fs";

/**
 * Extracts a mono MP3 from any video/audio file for Whisper transcription.
 * Results are cached — re-running is instant.
 */
export async function extractAudio(
  videoPath: string,
  outputDir: string
): Promise<string> {
  fs.mkdirSync(outputDir, { recursive: true });

  const audioPath = path.join(outputDir, "audio.mp3");

  if (fs.existsSync(audioPath)) {
    console.log("   Using cached audio extraction.");
    return audioPath;
  }

  // -vn        skip video stream
  // -ac 1      downmix to mono (reduces Whisper API cost ~50%)
  // -ar 16000  16 kHz sample rate (optimal for Whisper)
  // -q:a 4     variable bitrate, good quality
  await $`ffmpeg -y \
    -i ${videoPath} \
    -vn \
    -ac 1 \
    -ar 16000 \
    -acodec libmp3lame \
    -q:a 4 \
    ${audioPath}`;

  const sizeMB = (fs.statSync(audioPath).size / 1024 / 1024).toFixed(1);
  console.log(`   Extracted ${sizeMB} MB of audio`);

  return audioPath;
}
