"use client";

import { useEffect, useState } from "react";
import { Library, Clock, ExternalLink } from "lucide-react";
import type { DistillResult } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryEntrySummary {
  id: string;
  url: string;
  title: string;
  platform: string;
  duration: string;
  createdAt: string;
}

interface HistoryListProps {
  onSelectResult: (result: DistillResult) => void;
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

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (!res.ok) return;
        const data = (await res.json()) as HistoryEntrySummary[];
        if (!cancelled) {
          setEntries(data.slice(0, 20));
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelect(entry: HistoryEntrySummary) {
    try {
      const res = await fetch(`/api/history?id=${entry.id}`);
      if (!res.ok) return;
      const data = await res.json();
      onSelectResult(data.result as DistillResult);
    } catch {
      // silently fail
    }
  }

  // Loading state
  if (loading) {
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

  // No history — show tagline
  if (entries.length === 0) {
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

  // History list
  return (
    <section aria-label="ライブラリ">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Library className="size-4 text-text-secondary" />
        <h2 className="text-sm font-medium text-text-secondary">ライブラリ</h2>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-copper-muted px-1.5 text-xs font-medium text-copper">
          {entries.length}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map((entry) => {
          const platformColor =
            PLATFORM_COLORS[entry.platform] ?? "var(--text-muted)";
          const platformLabel =
            PLATFORM_LABELS[entry.platform] ?? entry.platform;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => handleSelect(entry)}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left transition-all duration-150 hover:border-copper/40 hover:bg-surface-elevated"
            >
              {/* Title */}
              <p className="text-sm font-medium leading-snug text-foreground group-hover:text-foreground/90">
                {truncate(entry.title, 60)}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Platform badge */}
                <span
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none"
                  style={{
                    backgroundColor: `${platformColor}18`,
                    color: platformColor,
                  }}
                >
                  {platformLabel}
                </span>

                {/* Duration */}
                {entry.duration && (
                  <span className="text-xs text-text-muted">
                    {entry.duration}
                  </span>
                )}

                {/* Date */}
                <span className="ml-auto flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="size-3" />
                  {relativeTime(entry.createdAt)}
                </span>
              </div>

              {/* URL */}
              <p className="flex items-center gap-1 text-xs text-text-muted/70">
                <ExternalLink className="size-3 shrink-0" />
                {truncate(entry.url, 50)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
