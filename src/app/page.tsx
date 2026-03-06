"use client";

import { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UrlInput } from "@/components/url-input";
import { ProgressBar } from "@/components/progress-bar";
import { VideoMeta } from "@/components/video-meta";
import { ResultTabs } from "@/components/result-tabs";
import type {
  AppState,
  DistillResult,
  ProgressEvent,
  ProcessStep,
} from "@/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AppState>({ status: "idle" });

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
            } else if (event.type === "complete") {
              setState({ status: "complete", result: event.data as DistillResult });
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

  const isProcessing = state.status === "processing";

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="no-print border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <h1 className="font-serif text-2xl tracking-tight text-foreground">
            Distill
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl space-y-12 px-4 py-12 md:px-8">
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
            <ProgressBar step={state.step} progress={state.progress} />
          </section>
        )}

        {/* Error */}
        {state.status === "error" && (
          <section
            aria-label="エラー"
            className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          >
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{state.message}</p>
          </section>
        )}

        {/* Results */}
        {state.status === "complete" && (
          <div className="space-y-6">
            <section aria-label="動画情報">
              <VideoMeta meta={state.result.meta} />
            </section>

            <section aria-label="結果">
              <ResultTabs result={state.result} />
            </section>
          </div>
        )}

        {/* Idle state */}
        {state.status === "idle" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl text-text-secondary">
              動画を蒸留して、本質を抽出する
            </p>
            <p className="mt-2 text-sm text-text-muted">
              YouTube・Loom・UTAGEのURLを貼り付けてください
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
