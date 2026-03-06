import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages/messages";
import { DistillError } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

/** Claude API 音声入力の最大サイズ (bytes) — 安全マージンを含む */
const MAX_CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB

/** 分割時の 1 チャンクの長さ (秒) */
const CHUNK_DURATION_SEC = 600; // 10分

// ---------------------------------------------------------------------------
// Claude クライアント
// ---------------------------------------------------------------------------

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new DistillError("API_KEY_MISSING", "ANTHROPIC_API_KEY を設定してください");
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// 音声分割
// ---------------------------------------------------------------------------

async function splitAudio(
  audioPath: string,
  outputDir: string,
): Promise<string[]> {
  // ffprobe で総時間を取得
  const { stdout: probeOut } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    audioPath,
  ]);

  const totalDuration = parseFloat(probeOut.trim());
  if (isNaN(totalDuration)) {
    throw new DistillError("EXTRACTION_FAILED", "音声ファイルの解析に失敗しました");
  }

  // 3時間超はエラー
  if (totalDuration > 3 * 3600) {
    throw new DistillError("AUDIO_TOO_LONG", "動画が長すぎます（最大3時間）");
  }

  const chunkCount = Math.ceil(totalDuration / CHUNK_DURATION_SEC);
  const chunks: string[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_DURATION_SEC;
    const chunkPath = path.join(outputDir, `chunk_${i}.mp3`);

    await execFileAsync("ffmpeg", [
      "-i",
      audioPath,
      "-ss",
      String(start),
      "-t",
      String(CHUNK_DURATION_SEC),
      "-acodec",
      "libmp3lame",
      "-q:a",
      "4",
      "-ar",
      "16000",
      "-ac",
      "1",
      "-y",
      chunkPath,
    ]);

    chunks.push(chunkPath);
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// 1 チャンクを文字起こし
// ---------------------------------------------------------------------------

async function transcribeChunk(
  client: Anthropic,
  audioPath: string,
): Promise<string> {
  const audioBuffer = await readFile(audioPath);
  const audioBase64 = audioBuffer.toString("base64");

  // SDK の型定義に audio タイプが未反映のためキャストで対応
  const params = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user" as const,
        content: [
          {
            type: "audio",
            source: {
              type: "base64",
              media_type: "audio/mp3",
              data: audioBase64,
            },
          },
          {
            type: "text",
            text: "この音声を日本語で正確に文字起こししてください。話者の発言をそのまま書き起こし、句読点を適切に入れてください。",
          },
        ],
      },
    ],
  } as unknown as MessageCreateParamsNonStreaming;

  const response = await client.messages.create(params);

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "";
}

// ---------------------------------------------------------------------------
// メインエントリ
// ---------------------------------------------------------------------------

/**
 * 音声ファイルを文字起こしする。
 * 20MB を超える場合はチャンク分割して順次処理し、結果を結合する。
 */
export async function transcribe(audioPath: string): Promise<string> {
  const client = getClient();
  const fileStat = await stat(audioPath);

  // ファイルサイズが制限以下ならそのまま処理
  if (fileStat.size <= MAX_CHUNK_SIZE) {
    try {
      return await transcribeChunk(client, audioPath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new DistillError(
        "TRANSCRIPTION_FAILED",
        `文字起こしに失敗しました: ${message}`,
      );
    }
  }

  // 分割処理
  const outputDir = path.dirname(audioPath);
  const chunks = await splitAudio(audioPath, outputDir);

  const transcripts: string[] = [];
  for (const chunk of chunks) {
    try {
      const text = await transcribeChunk(client, chunk);
      transcripts.push(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "不明なエラー";
      throw new DistillError(
        "TRANSCRIPTION_FAILED",
        `文字起こしに失敗しました (チャンク ${chunks.indexOf(chunk) + 1}/${chunks.length}): ${message}`,
      );
    }
  }

  return transcripts.join("\n\n");
}
