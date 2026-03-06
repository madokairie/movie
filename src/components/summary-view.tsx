"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Summary } from "@/types";

type SummaryMode = "oneliner" | "detailed" | "chapters";

const MODE_LABELS: Record<SummaryMode, string> = {
  oneliner: "核心ノウハウ",
  detailed: "詳細ノウハウ",
  chapters: "章別テクニック",
};

interface SummaryViewProps {
  summary: Summary;
}

export function SummaryView({ summary }: SummaryViewProps) {
  const [mode, setMode] = useState<SummaryMode>("oneliner");
  const [copied, setCopied] = useState(false);

  const getCopyText = () => {
    switch (mode) {
      case "oneliner":
        return summary.oneliner;
      case "detailed":
        return summary.detailed;
      case "chapters":
        return summary.chapters
          .map((c, i) => `${i + 1}. ${c.title}\n${c.summary}`)
          .join("\n\n");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border bg-transparent text-sm text-foreground"
            >
              {MODE_LABELS[mode]}
              <ChevronDown className="size-3.5 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {(Object.entries(MODE_LABELS) as [SummaryMode, string][]).map(
              ([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setMode(key)}
                  className={mode === key ? "text-copper" : ""}
                >
                  {label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "コピーしました" : "テキストをコピー"}
          className="gap-1.5 text-xs text-text-secondary hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-success" />
              コピーしました
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              コピー
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="max-h-[600px]">
        {mode === "oneliner" && (
          <div className="flex items-center justify-center py-8">
            <p className="max-w-lg text-center text-lg leading-[1.8] text-foreground">
              {summary.oneliner}
            </p>
          </div>
        )}

        {mode === "detailed" && (
          <p className="whitespace-pre-wrap text-sm leading-[1.8] text-foreground">
            {summary.detailed}
          </p>
        )}

        {mode === "chapters" && (
          <div className="space-y-3">
            {summary.chapters.map((chapter, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-copper-muted text-xs font-medium text-copper">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">
                    {chapter.title}
                  </h3>
                  {chapter.timestamp && (
                    <span className="ml-auto text-xs tabular-nums text-text-muted">
                      {chapter.timestamp}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {chapter.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
