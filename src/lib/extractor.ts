import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import type { ExtractionResult, Platform } from "@/types";
import { DistillError } from "@/types";
import * as youtube from "@/lib/platforms/youtube";
import * as loom from "@/lib/platforms/loom";
import * as utage from "@/lib/platforms/utage";
import * as generic from "@/lib/platforms/generic";

// ---------------------------------------------------------------------------
// URL バリデーション
// ---------------------------------------------------------------------------

const URL_PATTERN = /^https?:\/\/.+/;

function validateUrl(url: string): void {
  if (!URL_PATTERN.test(url)) {
    throw new DistillError("INVALID_URL", "有効なURLを入力してください");
  }
}

// ---------------------------------------------------------------------------
// プラットフォーム判定
// ---------------------------------------------------------------------------

export function detectPlatform(url: string): Platform {
  if (youtube.isYouTubeUrl(url)) return "youtube";
  if (loom.isLoomUrl(url)) return "loom";
  if (utage.isUtageUrl(url)) return "utage";
  return "generic";
}

// ---------------------------------------------------------------------------
// 音声抽出
// ---------------------------------------------------------------------------

export async function extractAudio(url: string): Promise<ExtractionResult> {
  validateUrl(url);

  const platform = detectPlatform(url);
  const sessionId = randomUUID();
  const outputDir = path.join("/tmp", "distill", sessionId);

  await mkdir(outputDir, { recursive: true });

  try {
    let audioPath: string;
    let meta;

    switch (platform) {
      case "youtube":
        [audioPath, meta] = await Promise.all([
          youtube.extractAudio(url, outputDir),
          youtube.getVideoMeta(url),
        ]);
        break;

      case "loom":
        [audioPath, meta] = await Promise.all([
          loom.extractAudio(url, outputDir),
          loom.getVideoMeta(url),
        ]);
        break;

      case "utage":
        // UTAGE はメタ取得を先にやる（HTML を 2 回取得しないため）
        meta = await utage.getVideoMeta(url);
        audioPath = await utage.extractAudio(url, outputDir);
        break;

      case "generic":
        [audioPath, meta] = await Promise.all([
          generic.extractAudio(url, outputDir),
          generic.getVideoMeta(url),
        ]);
        break;
    }

    return { audioPath, meta };
  } catch (error) {
    // 失敗時はディレクトリをクリーンアップ
    await cleanup(outputDir);

    if (error instanceof DistillError) throw error;

    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    throw new DistillError("EXTRACTION_FAILED", `音声の取得に失敗しました: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// クリーンアップ
// ---------------------------------------------------------------------------

export async function cleanup(audioPath: string): Promise<void> {
  try {
    // audioPath がファイルパスの場合はその親ディレクトリを削除
    const dir = audioPath.endsWith(".mp3") ? path.dirname(audioPath) : audioPath;

    // /tmp/distill/ 配下のみ削除を許可（安全策）
    if (dir.startsWith(path.join("/tmp", "distill"))) {
      await rm(dir, { recursive: true, force: true });
    }
  } catch {
    // クリーンアップ失敗は無視
  }
}
