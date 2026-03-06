"use client";

import { useState, useCallback } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { UrlInput } from "@/components/url-input";
import { ProgressBar } from "@/components/progress-bar";
import { VideoMeta } from "@/components/video-meta";
import { ResultTabs } from "@/components/result-tabs";
import { HistoryList } from "@/components/history-list";
import type {
  AppState,
  DistillResult,
  ProcessStep,
} from "@/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [processingExtra, setProcessingExtra] = useState<{ elapsed?: number; estimate?: string }>({});
  const [historyId, setHistoryId] = useState<string | undefined>();

  const handleDistill = useCallback(async () => {
    setState({ status: "processing", step: "extracting", progress: 0 });

    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "処理に失敗しました" }));
        setState({ status: "error", message: err.message ?? "処理に失敗しました" });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setState({ status: "error", message: "ストリーム読み取りに失敗しました" });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);

            if (event.type === "progress") {
              setState({
                status: "processing",
                step: event.step as ProcessStep,
                progress: event.progress,
              });
              setProcessingExtra({
                elapsed: event.elapsed as number | undefined,
                estimate: event.estimate as string | undefined,
              });
            } else if (event.type === "complete") {
              setState({ status: "complete", result: event.data as DistillResult });
              if (event.historyId) setHistoryId(event.historyId as string);
            } else if (event.type === "error") {
              setState({
                status: "error",
                message: event.message ?? "処理に失敗しました",
              });
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "通信エラーが発生しました",
      });
    }
  }, [url]);

  const handleLoadFromHistory = useCallback((result: DistillResult, id?: string) => {
    setState({ status: "complete", result });
    setUrl("");
    setHistoryId(id);
  }, []);

  const handleReset = useCallback(() => {
    setState({ status: "idle" });
    setUrl("");
    setProcessingExtra({});
    setHistoryId(undefined);
  }, []);

  const isProcessing = state.status === "processing";

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="no-print border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={state.status !== "idle" ? handleReset : undefined}
            className={`font-serif text-2xl tracking-tight text-foreground ${state.status !== "idle" ? "cursor-pointer hover:text-copper transition-colors duration-150" : ""}`}
          >
            Distill
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl space-y-8 md:space-y-12 px-4 py-12 md:px-8">
        {/* URL Input */}
        <section className="no-print" aria-label="URL入力">
          <UrlInput
            url={url}
            onUrlChange={setUrl}
            onSubmit={handleDistill}
            isProcessing={isProcessing}
          />
        </section>

        {/* Processing */}
        {state.status === "processing" && (
          <section aria-label="処理中">
            <ProgressBar
              step={state.step}
              progress={state.progress}
              elapsed={processingExtra.elapsed}
              estimate={processingExtra.estimate}
            />
          </section>
        )}

        {/* Error */}
        {state.status === "error" && (
          <section
            aria-label="エラー"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{state.message}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (url.trim()) {
                  handleDistill();
                } else {
                  setState({ status: "idle" });
                }
              }}
              className="shrink-0 rounded-md bg-surface px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:bg-surface-elevated"
            >
              {url.trim() ? "再試行" : "戻る"}
            </button>
          </section>
        )}

        {/* Results */}
        {state.status === "complete" && (
          <div className="animate-fade-in space-y-6">
            <button
              type="button"
              onClick={handleReset}
              className="no-print inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              新しく分析
            </button>

            <section aria-label="動画情報">
              <VideoMeta
                meta={state.result.meta}
                historyId={historyId}
                onTitleChange={(newTitle) => {
                  if (state.status === "complete") {
                    setState({
                      ...state,
                      result: {
                        ...state.result,
                        meta: { ...state.result.meta, title: newTitle },
                      },
                    });
                  }
                }}
              />
            </section>

            <section aria-label="結果">
              <ResultTabs result={state.result} url={url} />
            </section>
          </div>
        )}

        {/* Idle state — show history or tagline */}
        {state.status === "idle" && (
          <HistoryList onSelectResult={handleLoadFromHistory} />
        )}
      </main>
    </div>
  );
}
