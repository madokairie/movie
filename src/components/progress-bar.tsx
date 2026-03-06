"use client";

import { useEffect, useState } from "react";
import type { ProcessStep } from "@/types";

const STEPS: { key: ProcessStep; label: string; detail: string }[] = [
  { key: "extracting", label: "音声を抽出中", detail: "動画から音声データを取得しています" },
  { key: "transcribing", label: "文字起こし中", detail: "AIが音声をテキストに変換しています" },
  { key: "generating", label: "コンテンツ生成中", detail: "要約・ブログ・SNS投稿を作成しています" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}秒`;
  return `${m}分${s.toString().padStart(2, "0")}秒`;
}

interface ProgressBarProps {
  step: ProcessStep;
  progress: number;
  elapsed?: number;
  estimate?: string;
}

export function ProgressBar({ step, progress, elapsed: serverElapsed, estimate }: ProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const current = STEPS[currentIndex];

  // Client-side elapsed timer for smooth updates
  const [localElapsed, setLocalElapsed] = useState(serverElapsed ?? 0);

  useEffect(() => {
    if (serverElapsed !== undefined) {
      setLocalElapsed(serverElapsed);
    }
  }, [serverElapsed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface p-8" role="status" aria-live="polite">
      {/* Current step */}
      <div className="mb-6 text-center">
        <p className="text-lg font-medium text-foreground">{current?.label ?? ""}</p>
        <p className="mt-1 text-sm text-text-secondary">{current?.detail ?? ""}</p>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-border/50">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-copper transition-all duration-500 ease-out"
          style={{ width: `${Math.max(progress, 2)}%` }}
        />
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-copper/30 to-transparent" />
      </div>

      {/* Time info */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-text-secondary">
          <span className="inline-block size-2 animate-pulse rounded-full bg-copper" />
          <span>経過: {formatTime(localElapsed)}</span>
        </div>
        <div className="text-text-secondary">
          {estimate && <span>目安: {estimate}</span>}
        </div>
      </div>

      {/* Step indicators */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`size-3 rounded-full border-2 transition-all duration-300 ${
                  i < currentIndex
                    ? "border-copper bg-copper"
                    : i === currentIndex
                      ? "border-copper bg-copper animate-pulse"
                      : "border-border bg-transparent"
                }`}
              />
              <span className={`text-xs ${
                i <= currentIndex ? "text-copper" : "text-text-secondary"
              }`}>
                {s.label.replace("中", "")}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-5 h-0.5 w-12 transition-colors duration-300 ${
                  i < currentIndex ? "bg-copper" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <span className="sr-only">
        {current?.label} {Math.round(progress)}%完了 経過{formatTime(localElapsed)}
      </span>
    </div>
  );
}
