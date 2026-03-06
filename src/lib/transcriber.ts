import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { DistillError } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Whisper CLI path
// ---------------------------------------------------------------------------

const WHISPER_PATH = "/Users/iriemadoka/Library/Python/3.9/bin/whisper";

// ---------------------------------------------------------------------------
// Transcribe using local Whisper
// ---------------------------------------------------------------------------

export async function transcribe(audioPath: string): Promise<string> {
  const outputDir = path.dirname(audioPath);

  try {
    await execFileAsync(
      WHISPER_PATH,
      [
        audioPath,
        "--language", "ja",
        "--model", "base",
        "--output_format", "txt",
        "--output_dir", outputDir,
      ],
      {
        timeout: 30 * 60 * 1000, // 30 min max
        maxBuffer: 50 * 1024 * 1024, // 50MB stdout buffer
      },
    );

    // Whisper outputs <filename_without_ext>.txt
    const baseName = path.basename(audioPath, path.extname(audioPath));
    const txtPath = path.join(outputDir, `${baseName}.txt`);
    const transcript = await readFile(txtPath, "utf-8");

    if (!transcript.trim()) {
      throw new Error("文字起こし結果が空です");
    }

    return transcript.trim();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラー";
    throw new DistillError(
      "TRANSCRIPTION_FAILED",
      `文字起こしに失敗しました: ${message}`,
    );
  }
}
