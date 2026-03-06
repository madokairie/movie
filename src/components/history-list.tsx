"use client";

import { useEffect, useState } from "react";
import { Library, Clock, ExternalLink, Tag, Trash2, Loader2 } from "lucide-react";
import type { DistillResult, HistoryEntry } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryEntrySummary {
  id: string;
  url: string;
  title: string;
  platform: string;
  duration: string;
  category: string;
  createdAt: string;
}

interface HistoryListProps {
  onSelectResult: (result: DistillResult, id?: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ff0000",
  loom: "#625df5",
  utage: "#c2824a",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  loom: "Loom",
  utage: "UTAGE",
  generic: "Video",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "たった今";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "昨日";
  if (diffDay < 7) return `${diffDay}日前`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}週間前`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}ヶ月前`;
  return `${Math.floor(diffMonth / 12)}年前`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HistoryList({ onSelectResult }: HistoryListProps) {
  const [entries, setEntries] = useState<HistoryEntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) return;
        const data = (await res.json()) as HistoryEntrySummary[];
        if (!cancelled) {
          setEntries(data.slice(0, 50));
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, []);

  async function handleSelect(entry: HistoryEntrySummary) {
    setLoadingId(entry.id);
    try {
      const res = await fetch(`/api/history?id=${entry.id}`);
      if (!res.ok) return;
      const data = await res.json();
      onSelectResult(data.result as DistillResult, entry.id);
    } catch {
      // silently fail
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((entry) => entry.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  // Loading / empty states
  if (loading || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-serif text-2xl text-foreground/70">
          動画から、要点だけを取り出す
        </p>
        <p className="mt-3 text-sm text-text-secondary">
          URLを貼るだけで文字起こし・要約・ブログ・SNS投稿を自動生成
        </p>
      </div>
    );
  }

  // Extract unique categories
  const categories = ["すべて", ...Array.from(new Set(entries.map((e) => e.category || "その他")))];

  // Filter
  const filtered = selectedCategory === "すべて"
    ? entries
    : entries.filter((e) => (e.category || "その他") === selectedCategory);

  return (
    <section aria-label="ライブラリ">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Library className="size-4 text-copper" />
          <h2 className="text-base font-medium text-foreground">ライブラリ</h2>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-copper/15 px-1.5 text-xs font-medium text-copper">
            {entries.length}
          </span>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
              selectedCategory === cat
                ? "bg-copper text-white"
                : "bg-surface text-text-secondary hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            {cat !== "すべて" && <Tag className="size-3" />}
            {cat}
            {cat !== "すべて" && (
              <span className="text-[10px] opacity-70">
                {entries.filter((e) => (e.category || "その他") === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((entry) => {
          const platformColor = PLATFORM_COLORS[entry.platform] ?? "var(--text-muted)";
          const platformLabel = PLATFORM_LABELS[entry.platform] ?? entry.platform;

          return (
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(entry)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(entry); } }}
              className={`group relative flex cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 text-left transition-all duration-150 hover:border-copper/40 hover:bg-surface-elevated${loadingId === entry.id ? " opacity-50 pointer-events-none" : ""}`}
            >
              {/* Loading overlay */}
              {loadingId === entry.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-copper" />
                </div>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => handleDelete(e, entry.id)}
                className="absolute right-3 top-3 shrink-0 rounded-md p-1 text-text-secondary opacity-0 transition-all duration-150 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label="削除"
              >
                <Trash2 className="size-3.5" />
              </button>

              {/* Title + Category */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug text-foreground group-hover:text-foreground/90">
                  {truncate(entry.title, 60)}
                </p>
                {entry.category && entry.category !== "その他" && (
                  <span className="shrink-0 rounded bg-copper/10 px-1.5 py-0.5 text-[10px] font-medium text-copper">
                    {entry.category}
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none"
                  style={{
                    backgroundColor: `${platformColor}18`,
                    color: platformColor,
                  }}
                >
                  {platformLabel}
                </span>

                {entry.duration && entry.duration !== "不明" && (
                  <span className="text-xs text-text-secondary">
                    {entry.duration}
                  </span>
                )}

                <span className="ml-auto flex items-center gap-1 text-xs text-text-secondary">
                  <Clock className="size-3" />
                  {relativeTime(entry.createdAt)}
                </span>
              </div>

              {/* URL */}
              <p className="flex items-center gap-1 text-xs text-text-secondary/60">
                <ExternalLink className="size-3 shrink-0" />
                {truncate(entry.url, 55)}
              </p>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-text-secondary">
          このカテゴリにはまだデータがありません
        </p>
      )}
    </section>
  );
}
