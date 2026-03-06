import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { VideoMeta } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// URL 解析
// ---------------------------------------------------------------------------

const UTAGE_PATTERN =
  /(?:https?:\/\/)?(?:[\w-]+\.)?utage-system\.com\/(?:p\/)?video\//;

export function isUtageUrl(url: string): boolean {
  return UTAGE_PATTERN.test(url);
}

// ---------------------------------------------------------------------------
// m3u8 URL 抽出
// ---------------------------------------------------------------------------

const M3U8_PATTERN =
  /https:\/\/s3\.ap-northeast-1\.wasabisys\.com\/utagesystem-video\/[^\s"']+\/video\.m3u8/;

/**
 * UTAGE ページの HTML から m3u8 URL を抽出する。
 * fetch はサーバーサイドの Node.js グローバル fetch を使用。
 */
export async function extractM3u8Url(pageUrl: string): Promise<string> {
  const res = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`UTAGE ページの取得に失敗しました (${res.status})`);
  }

  const html = await res.text();
  const match = html.match(M3U8_PATTERN);

  if (!match) {
    throw new Error("UTAGE ページから m3u8 URL を検出できませんでした");
  }

  return match[0];
}

// ---------------------------------------------------------------------------
// メタ情報取得
// ---------------------------------------------------------------------------

export async function getVideoMeta(pageUrl: string): Promise<VideoMeta> {
  // UTAGE はメタ情報 API がないため、ページタイトルを取得
  let title = "UTAGE動画";

  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
      title = titleMatch[1].trim();
    }
  } catch {
    // メタ取得失敗は無視
  }

  return {
    title,
    channel: "UTAGE",
    duration: "不明",
    platform: "utage",
    thumbnail: "",
  };
}

// ---------------------------------------------------------------------------
// 音声抽出
// ---------------------------------------------------------------------------

export async function extractAudio(
  pageUrl: string,
  outputDir: string,
): Promise<string> {
  const m3u8Url = await extractM3u8Url(pageUrl);
  const outputPath = path.join(outputDir, "audio.mp3");

  await execFileAsync("ffmpeg", [
    "-i",
    m3u8Url,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-q:a",
    "4",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-y",
    outputPath,
  ]);

  return outputPath;
}
