"use client";

import type { ProcessStep } from "@/types";
import { Progress } from "@/components/ui/progress";

const STEPS: { key: ProcessStep; label: string }[] = [
  { key: "extracting", label: "音声を抽出中..." },
  { key: "transcribing", label: "文字起こし中..." },
  { key: "generating", label: "コンテンツ生成中..." },
];

interface ProgressBarProps {
  step: ProcessStep;
  progress: number;
}

export function ProgressBar({ step, progress }: ProgressBarProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const currentLabel = STEPS[currentIndex]?.label ?? "";

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{currentLabel}</p>
        <p className="text-sm tabular-nums text-text-muted">
          {Math.round(progress)}%
        </p>
      </div>

      <Progress
        value={progress}
        aria-label="処理の進捗"
        className="h-1 rounded-full bg-surface"
      />

      {/* Step dots */}
      <div className="flex items-center justify-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={`size-2 rounded-full transition-colors duration-150 ${
                i <= currentIndex ? "bg-copper" : "bg-border"
              }`}
              aria-hidden="true"
            />
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-8 transition-colors duration-150 ${
                  i < currentIndex ? "bg-copper" : "bg-border"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      {/* Screen reader text */}
      <span className="sr-only">
        {currentLabel} {Math.round(progress)}%完了
      </span>
    </div>
  );
}
