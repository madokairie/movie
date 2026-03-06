// ---------------------------------------------------------------------------
// Distill - 型定義
// ---------------------------------------------------------------------------

/** 対応プラットフォーム */
export type Platform = "youtube" | "loom" | "utage" | "generic";

/** 処理ステップ */
export type ProcessStep = "extracting" | "transcribing" | "generating";

/** アクティブタブ */
export type ActiveTab = "transcript" | "summary" | "blog" | "sns";

// ---------------------------------------------------------------------------
// コンテンツ型
// ---------------------------------------------------------------------------

/** 動画メタ情報 */
export interface VideoMeta {
  title: string;
  channel: string;
  duration: string;
  platform: Platform;
  thumbnail: string;
}

/** チャプター要約 */
export interface Chapter {
  title: string;
  summary: string;
  timestamp: string;
}

/** 要約 */
export interface Summary {
  oneliner: string;
  detailed: string;
  chapters: Chapter[];
}

/** ブログ記事 */
export interface Blog {
  title: string;
  content: string; // Markdown
}

/** SNSコンテンツ */
export interface SnsContent {
  twitter: string[];
  instagram: string;
  linkedin: string;
}

/** Distill 処理結果 */
export interface DistillResult {
  meta: VideoMeta;
  transcript: string;
  summary: Summary;
  blog: Blog;
  sns: SnsContent;
}

// ---------------------------------------------------------------------------
// アプリケーション状態
// ---------------------------------------------------------------------------

export type AppState =
  | { status: "idle" }
  | { status: "processing"; step: ProcessStep; progress: number }
  | { status: "complete"; result: DistillResult }
  | { status: "error"; message: string };

// ---------------------------------------------------------------------------
// API リクエスト / レスポンス
// ---------------------------------------------------------------------------

/** POST /api/distill リクエスト */
export interface DistillRequest {
  url: string;
}

/** SSE progress イベント */
export interface ProgressEvent {
  step: ProcessStep;
  progress: number;
  message: string;
}

/** SSE complete イベント */
export type CompleteEvent = DistillResult;

/** SSE error イベント */
export interface ErrorEvent {
  code: string;
  message: string;
}

/** POST /api/pdf リクエスト */
export type PdfRequest = DistillResult;

// ---------------------------------------------------------------------------
// エラーコード
// ---------------------------------------------------------------------------

export type DistillErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PLATFORM"
  | "EXTRACTION_FAILED"
  | "TRANSCRIPTION_FAILED"
  | "GENERATION_FAILED"
  | "API_KEY_MISSING"
  | "RATE_LIMIT"
  | "AUDIO_TOO_LONG";

export class DistillError extends Error {
  constructor(
    public readonly code: DistillErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DistillError";
  }
}

// ---------------------------------------------------------------------------
// 内部ユーティリティ型
// ---------------------------------------------------------------------------

/** 音声抽出結果 */
export interface ExtractionResult {
  audioPath: string;
  meta: VideoMeta;
}

/** コンテンツ生成結果（Claude API からの JSON） */
export interface GeneratedContent {
  summary: Summary;
  blog: Blog;
  sns: SnsContent;
}
