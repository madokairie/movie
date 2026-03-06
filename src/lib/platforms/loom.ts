import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { VideoMeta } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// URL 解析
// ---------------------------------------------------------------------------

const LOOM_PATTERN = /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([\w-]+)/;

export function isLoomUrl(url: string): boolean {
  return LOOM_PATTERN.test(url);
}

export function extractVideoId(url: string): string | null {
  const match = url.match(LOOM_PATTERN);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// メタ情報取得
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function getVideoMeta(url: string): Promise<VideoMeta> {
  const { stdout } = await execFileAsync("yt-dlp", [
    "--dump-json",
    "--no-download",
    "--no-warnings",
    url,
  ]);

  const info = JSON.parse(stdout) as {
    title?: string;
    uploader?: string;
    duration?: number;
    thumbnail?: string;
  };

  return {
    title: info.title ?? "不明なタイトル",
    channel: info.uploader ?? "Loom",
    duration: info.duration ? formatDuration(info.duration) : "不明",
    platform: "loom",
    thumbnail: info.thumbnail ?? "",
  };
}

// ---------------------------------------------------------------------------
// 音声抽出
// ---------------------------------------------------------------------------

export async function extractAudio(
  url: string,
  outputDir: string,
): Promise<string> {
  const outputPath = path.join(outputDir, "audio.mp3");

  await execFileAsync("yt-dlp", [
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "4",
    "--postprocessor-args",
    "ffmpeg:-ar 16000 -ac 1",
    "-o",
    outputPath,
    "--no-warnings",
    url,
  ]);

  return outputPath;
}
