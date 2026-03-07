import { readFile, rm, mkdir } from "node:fs/promises";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { DistillError } from "@/types";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Whisper CLI path
// ---------------------------------------------------------------------------

const WHISPER_PATH = "/Users/iriemadoka/Library/Python/3.9/bin/whisper";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHUNK_DURATION_SEC = 600; // 10 minutes per chunk
const MAX_PARALLEL = 1; // sequential Whisper to avoid OOM on 16GB machines
const WHISPER_MAX_BUFFER = 100 * 1024 * 1024; // 100MB

// ---------------------------------------------------------------------------
// Get audio duration in seconds via ffprobe
// ---------------------------------------------------------------------------

async function getAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    audioPath,
  ]);
  const duration = parseFloat(stdout.trim());
  if (isNaN(duration)) {
    throw new Error("音声ファイルの長さを取得できませんでした");
  }
  return duration;
}

// ---------------------------------------------------------------------------
// Split audio into chunks using ffmpeg
// ---------------------------------------------------------------------------

async function splitAudio(
  audioPath: string,
  outputDir: string,
): Promise<string[]> {
  const duration = await getAudioDuration(audioPath);

  // Short enough — no split needed
  if (duration <= CHUNK_DURATION_SEC + 30) {
    return [audioPath];
  }

  const chunkCount = Math.ceil(duration / CHUNK_DURATION_SEC);
  const chunkPaths: string[] = [];

  for (let i = 0; i < chunkCount; i++) {
    const startSec = i * CHUNK_DURATION_SEC;
    const chunkPath = path.join(outputDir, `chunk_${String(i).padStart(3, "0")}.mp3`);

    await execFileAsync("ffmpeg", [
      "-i", audioPath,
      "-ss", String(startSec),
      "-t", String(CHUNK_DURATION_SEC),
      "-vn",
      "-acodec", "libmp3lame",
      "-q:a", "4",
      "-y",
      chunkPath,
    ], { timeout: 120_000 });

    chunkPaths.push(chunkPath);
  }

  return chunkPaths;
}

// ---------------------------------------------------------------------------
// Transcribe a single audio file with Whisper (spawn instead of execFile)
// Uses spawn to avoid maxBuffer issues and no timeout kill for long chunks
// ---------------------------------------------------------------------------

function transcribeOne(audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(audioPath);

    const proc = spawn(
      WHISPER_PATH,
      [
        audioPath,
        "--language", "ja",
        "--model", "base",
        "--output_format", "txt",
        "--output_dir", outputDir,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`Whisper起動失敗: ${err.message}`));
    });

    proc.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`Whisper終了コード${code}: ${stderr.slice(-500)}`));
        return;
      }

      try {
        const baseName = path.basename(audioPath, path.extname(audioPath));
        const txtPath = path.join(outputDir, `${baseName}.txt`);
        const text = (await readFile(txtPath, "utf-8")).trim();
        resolve(text);
      } catch (err) {
        reject(new Error(`Whisper出力読み取り失敗: ${err}`));
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Whisper hallucination filter
// ---------------------------------------------------------------------------

function cleanTranscript(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;

      // Remove lines that are just single repeated characters (ん、あ、etc.)
      if (/^(.)\1*$/.test(trimmed) && trimmed.length <= 3) return false;

      // Remove lines with excessive repetition of short phrases
      // e.g. "私は、私は、私は..." or "お店のお店のお店の..."
      const deduped = trimmed.replace(/(.{1,8})\1{3,}/g, "$1");
      if (deduped.length < trimmed.length * 0.3) return false;

      // Remove lines that are just filler sounds
      if (/^[んあうえおー、。\s]+$/.test(trimmed) && trimmed.length < 20) return false;

      return true;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Run promises in batches (concurrency limiter)
// ---------------------------------------------------------------------------

async function runInBatches<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Public: transcribe (with auto chunk-split for long audio)
// ---------------------------------------------------------------------------

export async function transcribe(audioPath: string): Promise<string> {
  const outputDir = path.dirname(audioPath);
  const chunksDir = path.join(outputDir, "chunks");

  try {
    await mkdir(chunksDir, { recursive: true });

    // Split into chunks
    const chunkPaths = await splitAudio(audioPath, chunksDir);

    if (chunkPaths.length === 1 && chunkPaths[0] === audioPath) {
      // No splitting needed — transcribe directly
      const raw = await transcribeOne(audioPath);
      const transcript = cleanTranscript(raw);
      if (!transcript) {
        throw new Error("文字起こし結果が空です");
      }
      return transcript;
    }

    // Transcribe chunks in parallel batches
    const tasks = chunkPaths.map(
      (cp) => () => transcribeOne(cp),
    );
    const results = await runInBatches(tasks, MAX_PARALLEL);

    // Clean up chunk files
    await rm(chunksDir, { recursive: true, force: true }).catch(() => {});

    const transcript = cleanTranscript(results.filter(Boolean).join("\n\n"));
    if (!transcript) {
      throw new Error("文字起こし結果が空です");
    }

    return transcript;
  } catch (error) {
    // Clean up on failure
    await rm(chunksDir, { recursive: true, force: true }).catch(() => {});

    if (error instanceof DistillError) throw error;

    const message =
      error instanceof Error ? error.message : "不明なエラー";
    throw new DistillError(
      "TRANSCRIPTION_FAILED",
      `文字起こしに失敗しました: ${message}`,
    );
  }
}
