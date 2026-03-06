import { NextRequest } from "next/server";
import { extractAudio, cleanup } from "@/lib/extractor";
import { transcribe } from "@/lib/transcriber";
import { generateContent } from "@/lib/generator";
import type { DistillRequest, DistillResult, ProgressEvent, ErrorEvent } from "@/types";
import { DistillError } from "@/types";

// ---------------------------------------------------------------------------
// SSE ヘルパー
// ---------------------------------------------------------------------------

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// POST /api/distill
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // リクエストバリデーション
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

  // SSE ストリーム
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let audioPath: string | null = null;

      function sendProgress(event: ProgressEvent) {
        controller.enqueue(encoder.encode(sseEncode("progress", event)));
      }

      function sendError(err: ErrorEvent) {
        controller.enqueue(encoder.encode(sseEncode("error", err)));
        controller.close();
      }

      try {
        // Step 1: 音声抽出
        sendProgress({
          step: "extracting",
          progress: 10,
          message: "音声を抽出中...",
        });

        const extraction = await extractAudio(url);
        audioPath = extraction.audioPath;
        const { meta } = extraction;

        sendProgress({
          step: "extracting",
          progress: 30,
          message: "音声の抽出が完了しました",
        });

        // Step 2: 文字起こし
        sendProgress({
          step: "transcribing",
          progress: 40,
          message: "文字起こし中...",
        });

        const transcript = await transcribe(audioPath);

        sendProgress({
          step: "transcribing",
          progress: 65,
          message: "文字起こしが完了しました",
        });

        // Step 3: コンテンツ生成
        sendProgress({
          step: "generating",
          progress: 70,
          message: "コンテンツを生成中...",
        });

        const generated = await generateContent(transcript, meta);

        sendProgress({
          step: "generating",
          progress: 95,
          message: "コンテンツ生成が完了しました",
        });

        // 完了
        const result: DistillResult = {
          meta,
          transcript,
          summary: generated.summary,
          blog: generated.blog,
          sns: generated.sns,
        };

        controller.enqueue(encoder.encode(sseEncode("complete", result)));
        controller.close();
      } catch (error) {
        if (error instanceof DistillError) {
          sendError({ code: error.code, message: error.message });
        } else {
          const message =
            error instanceof Error
              ? error.message
              : "不明なエラーが発生しました";
          sendError({ code: "EXTRACTION_FAILED", message });
        }
      } finally {
        // 一時ファイルのクリーンアップ
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
