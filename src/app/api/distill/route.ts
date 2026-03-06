import { NextRequest } from "next/server";
import { extractAudio, cleanup } from "@/lib/extractor";
import { transcribe } from "@/lib/transcriber";
import { generateContent } from "@/lib/generator";
import { saveResult } from "@/lib/storage";
import type { DistillRequest, DistillResult } from "@/types";
import { DistillError } from "@/types";

// ---------------------------------------------------------------------------
// SSE helper
// ---------------------------------------------------------------------------

function sseEncode(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// POST /api/distill
// ---------------------------------------------------------------------------

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  let body: DistillRequest;
  try {
    body = (await request.json()) as DistillRequest;
  } catch {
    return new Response(
      JSON.stringify({ code: "INVALID_URL", message: "不正なリクエストです" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { url } = body;

  if (!url || typeof url !== "string" || !/^https?:\/\/.+/.test(url)) {
    return new Response(
      JSON.stringify({ code: "INVALID_URL", message: "有効なURLを入力してください" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let audioPath: string | null = null;
      const startTime = Date.now();

      function send(data: Record<string, unknown>) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        controller.enqueue(
          encoder.encode(sseEncode({ ...data, elapsed })),
        );
      }

      function sendError(code: string, message: string) {
        send({ type: "error", code, message });
        controller.close();
      }

      try {
        // Step 1: Audio extraction
        send({
          type: "progress",
          step: "extracting",
          progress: 5,
          message: "音声を抽出中...",
          estimate: "動画の長さに応じて1〜10分",
        });

        const extraction = await extractAudio(url);
        audioPath = extraction.audioPath;
        const { meta } = extraction;

        send({
          type: "progress",
          step: "extracting",
          progress: 30,
          message: "音声の抽出が完了しました",
        });

        // Step 2: Transcription
        send({
          type: "progress",
          step: "transcribing",
          progress: 35,
          message: "文字起こし中...",
          estimate: "長い動画は分割処理するため数分かかります",
        });

        const transcript = await transcribe(audioPath);

        send({
          type: "progress",
          step: "transcribing",
          progress: 70,
          message: "文字起こしが完了しました",
        });

        // Step 3: Content generation
        send({
          type: "progress",
          step: "generating",
          progress: 75,
          message: "コンテンツを生成中...",
          estimate: "約30秒",
        });

        const generated = await generateContent(transcript, meta);

        send({
          type: "progress",
          step: "generating",
          progress: 95,
          message: "コンテンツ生成が完了しました",
        });

        // Complete
        const result: DistillResult = {
          meta,
          transcript,
          summary: generated.summary,
          blog: generated.blog,
          sns: generated.sns,
          category: generated.category ?? "その他",
        };

        // Persist to local history
        let historyId: string | undefined;
        try {
          historyId = await saveResult(url, result);
        } catch {
          // Storage failure should not block the response
        }

        send({ type: "complete", data: result, historyId });
        controller.close();
      } catch (error) {
        if (error instanceof DistillError) {
          sendError(error.code, error.message);
        } else {
          const message =
            error instanceof Error ? error.message : "不明なエラーが発生しました";
          sendError("EXTRACTION_FAILED", message);
        }
      } finally {
        if (audioPath) {
          await cleanup(audioPath);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
