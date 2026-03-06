import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { DistillResult } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: string;
  url: string;
  createdAt: string;
  result: DistillResult;
}

export interface HistoryEntrySummary {
  id: string;
  url: string;
  title: string;
  platform: string;
  duration: string;
  category: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), "data");
const HISTORY_FILE = join(DATA_DIR, "history.json");

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function readHistory(): Promise<HistoryEntry[]> {
  await ensureDataDir();
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const raw = await readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

async function writeHistory(entries: HistoryEntry[]): Promise<void> {
  await ensureDataDir();
  await writeFile(HISTORY_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a DistillResult with its source URL. Returns the generated id.
 */
export async function saveResult(
  url: string,
  result: DistillResult,
): Promise<string> {
  const entries = await readHistory();
  const id = randomUUID();
  const entry: HistoryEntry = {
    id,
    url,
    createdAt: new Date().toISOString(),
    result,
  };
  entries.unshift(entry); // newest first
  await writeHistory(entries);
  return id;
}

/**
 * Return all history entries (summary only, without full transcript/result).
 */
export async function getHistory(): Promise<HistoryEntrySummary[]> {
  const entries = await readHistory();
  return entries.map((e) => ({
    id: e.id,
    url: e.url,
    title: e.result.meta.title,
    platform: e.result.meta.platform,
    duration: e.result.meta.duration,
    category: e.result.category ?? "その他",
    createdAt: e.createdAt,
  }));
}

/**
 * Return the full history entry for a given id, or null if not found.
 */
export async function getResultById(
  id: string,
): Promise<HistoryEntry | null> {
  const entries = await readHistory();
  return entries.find((e) => e.id === id) ?? null;
}
