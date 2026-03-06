import Anthropic from "@anthropic-ai/sdk";
import type { VideoMeta, GeneratedContent } from "@/types";
import { DistillError } from "@/types";

// ---------------------------------------------------------------------------
// Claude クライアント
// ---------------------------------------------------------------------------

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new DistillError("API_KEY_MISSING", "ANTHROPIC_API_KEY を設定してください");
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// プロンプト
// ---------------------------------------------------------------------------

function buildPrompt(transcript: string, meta: VideoMeta): string {
  return `あなたはプロのコンテンツライターです。以下の動画文字起こしテキストから、4種類のコンテンツを生成してください。

## 動画情報
- タイトル: ${meta.title}
- チャンネル: ${meta.channel}
- 再生時間: ${meta.duration}

## 文字起こしテキスト
${transcript}

## 出力形式

以下の JSON のみを出力してください。JSON 以外のテキストは出力しないでください。

{
  "summary": {
    "oneliner": "3行以内の要約（150字以内）",
    "detailed": "300〜500字の詳細要約",
    "chapters": [
      {
        "title": "章タイトル",
        "summary": "章の要約（100〜200字）",
        "timestamp": "00:00"
      }
    ]
  },
  "blog": {
    "title": "ブログ記事タイトル",
    "content": "Markdown形式のブログ記事（1,500〜3,000字、です・ます調、見出し付き）"
  },
  "sns": {
    "twitter": ["X投稿1（280字以内、ハッシュタグ付き）", "X投稿2", "X投稿3"],
    "instagram": "Instagramキャプション（2,200字以内、絵文字・ハッシュタグ付き）",
    "linkedin": "LinkedIn投稿（1,300字以内、ビジネス向け）"
  }
}`;
}

// ---------------------------------------------------------------------------
// JSON パース
// ---------------------------------------------------------------------------

function parseGeneratedJson(text: string): GeneratedContent {
  // JSON ブロックが ```json ... ``` で囲まれている場合に対応
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonStr.trim()) as GeneratedContent;

    // 最低限のバリデーション
    if (!parsed.summary || !parsed.blog || !parsed.sns) {
      throw new Error("不完全な JSON 構造");
    }

    // デフォルト値の補完
    parsed.summary.oneliner = parsed.summary.oneliner ?? "";
    parsed.summary.detailed = parsed.summary.detailed ?? "";
    parsed.summary.chapters = parsed.summary.chapters ?? [];
    parsed.blog.title = parsed.blog.title ?? "";
    parsed.blog.content = parsed.blog.content ?? "";
    parsed.sns.twitter = parsed.sns.twitter ?? [];
    parsed.sns.instagram = parsed.sns.instagram ?? "";
    parsed.sns.linkedin = parsed.sns.linkedin ?? "";

    return parsed;
  } catch {
    throw new DistillError(
      "GENERATION_FAILED",
      "コンテンツ生成結果のパースに失敗しました",
    );
  }
}

// ---------------------------------------------------------------------------
// メインエントリ
// ---------------------------------------------------------------------------

/**
 * 文字起こしテキストと動画メタ情報から、要約・ブログ・SNS コンテンツを生成する。
 */
export async function generateContent(
  transcript: string,
  meta: VideoMeta,
): Promise<GeneratedContent> {
  const client = getClient();
  const prompt = buildPrompt(transcript, meta);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude API からテキスト応答がありませんでした");
    }

    return parseGeneratedJson(textBlock.text);
  } catch (error) {
    if (error instanceof DistillError) throw error;

    const message =
      error instanceof Error ? error.message : "不明なエラー";
    throw new DistillError(
      "GENERATION_FAILED",
      `コンテンツ生成に失敗しました: ${message}`,
    );
  }
}
