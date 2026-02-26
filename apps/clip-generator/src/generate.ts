import { $ } from "bun";
import path from "path";
import fs from "fs";
import type { Clip } from "./select-clips";

export type GeneratedClip = Clip & { outputPath: string };

/**
 * Cuts video clips from the source file using ffmpeg.
 * Outputs H.264/AAC MP4s compatible with all platforms.
 *
 * Requires ffmpeg: brew install ffmpeg
 */
export async function generateClips(
  videoPath: string,
  clips: Clip[],
  outputDir: string
): Promise<GeneratedClip[]> {
  fs.mkdirSync(outputDir, { recursive: true });

  const results: GeneratedClip[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]!;
    const duration = clip.endTime - clip.startTime;
    const slug = clip.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const filename = `${i + 1}-${slug}.mp4`;
    const outputPath = path.join(outputDir, filename);

    // -ss before -i  → fast input seek (keyframe-accurate, not frame-accurate)
    // -t             → clip duration
    // -c:v libx264   → H.264 video, widely compatible
    // -c:a aac       → AAC audio
    // -movflags +faststart → moov atom at front for instant web playback
    // -preset fast   → good speed/quality balance
    // -crf 23        → constant rate factor (18=lossless quality, 28=smaller file)
    await $`ffmpeg -y \
      -ss ${clip.startTime} \
      -i ${videoPath} \
      -t ${duration} \
      -c:v libx264 \
      -preset fast \
      -crf 23 \
      -c:a aac \
      -b:a 128k \
      -movflags +faststart \
      ${outputPath}`;

    results.push({ ...clip, outputPath });

    const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
    console.log(`   [${i + 1}/5] ${clip.title}`);
    console.log(
      `         ⏱  ${formatDuration(duration)}  |  🔥 ${clip.estimatedViralScore}/10  |  ${clip.category}  |  ${sizeMB} MB`
    );
    console.log(`         Hook: "${clip.hook}"`);
    console.log();
  }

  return results;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
