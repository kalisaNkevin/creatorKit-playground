import { $ } from "bun";
import path from "path";
import fs from "fs";

/**
 * Downloads audio from a YouTube URL using yt-dlp.
 * Requires yt-dlp to be installed: brew install yt-dlp
 */
export async function downloadPodcast(
  url: string,
  outputDir: string
): Promise<string> {
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "podcast.mp3");

  // Skip download if already cached
  if (fs.existsSync(outputPath)) {
    console.log("   Using cached audio file.");
    return outputPath;
  }

  const template = path.join(outputDir, "podcast.%(ext)s");

  await $`yt-dlp \
    --extract-audio \
    --audio-format mp3 \
    --audio-quality 0 \
    --output ${template} \
    --no-playlist \
    ${url}`;

  return outputPath;
}
