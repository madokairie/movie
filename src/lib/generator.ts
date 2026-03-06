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
  return `あなたはプロのナレッジライターです。以下の動画文字起こしテキストから、核心的なノウハウ・知見を抽出し、4種類のコンテンツを生成してください。

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
    "oneliner": "1行でこの動画の核心的なノウハウを表現（80字以内）。「〜する方法」「〜のコツ」など、実践的な表現にする。",
    "detailed": "実践的なノウハウ・テクニックを箇条書きで整理（各項目に具体的なアクションを含める）。読者がすぐ実行できるレベルの粒度で書く。マークダウンの箇条書き形式。500〜800字。",
    "chapters": [
      {
        "title": "この章で教えている具体的テクニック名",
        "summary": "そのテクニック・メソッドの具体的な内容と実践方法（100〜200字）",
        "timestamp": "00:00"
      }
    ]
  },
  "blog": {
    "title": "読者が得られるノウハウが明確に伝わるタイトル",
    "content": "ナレッジ記事（動画の要約ではなく、読者が実践できる知識記事として構成する）。構成: 核心ノウハウの提示 → 各テクニックの詳細解説 → 実践ステップ。Markdown形式、1,500〜3,000字、です・ます調、見出し付き。"
  },
  "sns": {
    "twitter": [
      "X投稿1: フック型（1行目で止まらせる衝撃的な事実やデータ。改行して具体ノウハウを凝縮。140字以内。ハッシュタグ禁止）",
      "X投稿2: ノウハウ列挙型（核心テクニックを箇条書き風に。140字以内。ハッシュタグ禁止）",
      "X投稿3: 逆説・意外性型（常識と逆のことを提示してから真実を。140字以内。ハッシュタグ禁止）",
      "X投稿4: ストーリー型（Before/Afterの変化を描く。140字以内。ハッシュタグ禁止）",
      "X投稿5: 問いかけ型（読者に質問→回答として知見を提供。140字以内。ハッシュタグ禁止）",
      "X長文投稿: ノート/記事スタイル（動画のノウハウを体系的にまとめた長文。1000〜2000字。ハッシュタグ禁止）"
    ],
    "instagram": "Instagramキャプション（2,200字以内、絵文字あり、ハッシュタグ禁止）。動画から得られるノウハウを実践的に整理。",
    "linkedin": "LinkedIn投稿（1,300字以内、ビジネス向け、ハッシュタグ禁止）"
  }
}

## 重要な注意事項
- SNS投稿にハッシュタグ(#)は絶対に使わないこと
- X投稿は5つの短文（各140字以内）＋1つの長文（1000〜2000字）の計6つ
- 「この動画では〜」という要約ではなく、読者/フォロワーが直接活用できるナレッジとして書くこと`;
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
