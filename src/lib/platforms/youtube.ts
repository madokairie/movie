import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { VideoMeta } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// URL 解析
// ---------------------------------------------------------------------------

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,
];

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((re) => re.test(url));
}

export function extractVideoId(url: string): string | null {
  for (const re of YOUTUBE_PATTERNS) {
    const match = url.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
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
    channel?: string;
    uploader?: string;
    duration?: number;
    thumbnail?: string;
  };

  return {
    title: info.title ?? "不明なタイトル",
    channel: info.channel ?? info.uploader ?? "不明なチャンネル",
    duration: info.duration ? formatDuration(info.duration) : "不明",
    platform: "youtube",
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
