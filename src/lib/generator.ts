import Anthropic from "@anthropic-ai/sdk";
import type { VideoMeta, GeneratedContent } from "@/types";
import { DistillError } from "@/types";

// ---------------------------------------------------------------------------
// Claude client
// ---------------------------------------------------------------------------

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new DistillError("API_KEY_MISSING", "ANTHROPIC_API_KEY を設定してください");
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(transcript: string, meta: VideoMeta): string {
  return `あなたは一流のビジネスナレッジライターです。
以下の動画文字起こしテキストから、**すぐに実践できるレベル**のノウハウを抽出し、ナレッジ資産として整理してください。

## 動画情報
- タイトル: ${meta.title}
- チャンネル: ${meta.channel}
- 再生時間: ${meta.duration}

## 文字起こしテキスト
${transcript}

## あなたの役割
- この動画の内容を「見なくても完全に理解し、すぐ実践できる」レベルでナレッジ化する
- 「この動画では〜を紹介しています」のような薄い要約は絶対に書かない
- 具体的な数字、手順、テクニック、フレームワークをすべて拾い上げる
- 読んだ人が明日から自分のビジネスに落とし込めるレベルの具体性を持たせる

## 出力形式

以下の JSON のみを出力してください。JSON 以外のテキストは出力しないでください。

{
  "category": "この動画の内容に最も適したカテゴリを1つ選択: マーケティング / セールス / コピーライティング / SNS運用 / コンテンツ制作 / ビジネス戦略 / マインドセット / ブランディング / 集客 / 商品設計 / その他",
  "summary": {
    "oneliner": "この動画の核心ノウハウを1行で表現（例: 「LPの成約率を3倍にするファーストビューの設計法」）。具体的で、これだけ読んでも価値がある表現にする。80字以内。",
    "detailed": "【ここが最も重要】この動画で語られているノウハウの完全版をここに書く。以下のルールに従うこと：\\n\\n- 長さ制限なし。1500〜3000字でしっかり書く\\n- 動画内で語られた具体的なテクニック・手法・フレームワークを全て網羅する\\n- 各ノウハウには「なぜそうするのか」の理由と「具体的にどうやるのか」の手順を含める\\n- 数字やデータが出ていたらそのまま引用する\\n- 実例・事例が語られていたら具体的に記載する\\n- 「〜が大事です」で終わらせず「具体的には〜する」まで書く\\n- マークダウンで構造化する（##見出し、箇条書き、太字を使用）\\n\\n構成例：\\n## 核心ノウハウ\\n（最も重要なポイントを3〜5つ）\\n\\n## テクニック詳細\\n（各テクニックの具体的な実践方法）\\n\\n## 実践ステップ\\n（読者が明日からやるべき具体的アクション）\\n\\n## 注意点・よくある失敗\\n（動画内で触れられた失敗パターンや注意点）",
    "chapters": [
      {
        "title": "具体的なテクニック名（例: ファーストビューの3秒ルール）",
        "summary": "そのテクニックの完全な説明。なぜ効果があるのか、どうやるのか、具体例は何か。動画で語られた内容をすべて含める。300〜500字。読んだだけで実践できるレベルで書く。",
        "timestamp": "00:00"
      }
    ]
  },
  "blog": {
    "title": "読者がクリックしたくなる、得られるノウハウが明確なタイトル",
    "content": "ナレッジ記事として構成。動画の要約ではなく、読者が読んだだけで実践できるノウハウ記事にする。\\n\\n構成:\\n1. リード（このノウハウで何が変わるか）\\n2. 核心（最も重要なポイント）\\n3. 実践テクニック（具体的な手法を順番に解説）\\n4. 事例・データ（動画内の具体例）\\n5. 実践チェックリスト（読者がすぐ使えるステップ）\\n\\nMarkdown形式、2000〜4000字、です・ます調。"
  },
  "sns": {
    "twitter": [
      "【フック型】1行目で読者の手を止める。改行して核心ノウハウを凝縮。140字以内。ハッシュタグ禁止。具体的な数字やテクニック名を入れる。",
      "【リスト型】核心テクニックを3〜5個の箇条書き風に。140字以内。ハッシュタグ禁止。",
      "【逆説型】常識と逆のことを提示→真実を提供。140字以内。ハッシュタグ禁止。",
      "【ストーリー型】Before→Afterの変化を描写。140字以内。ハッシュタグ禁止。",
      "【問いかけ型】読者に質問→回答としてノウハウを提供。140字以内。ハッシュタグ禁止。",
      "【長文X記事】この動画のノウハウを1500〜2500字で体系的にまとめた長文ポスト。構成: 冒頭で結論→具体テクニックを順に解説→まとめ。ハッシュタグ禁止。改行を活用して読みやすく。"
    ],
    "instagram": "Instagramキャプション。読者が保存したくなる実践的ノウハウを整理。絵文字あり、ハッシュタグ禁止。2200字以内。",
    "linkedin": "LinkedIn投稿。ビジネスパーソン向けにノウハウを整理。1300字以内。ハッシュタグ禁止。"
  }
}

## 絶対に守るルール
1. ハッシュタグ(#記号)はSNS投稿に絶対に使わない（マークダウンの見出し ## は可）
2. 「この動画では〜を紹介しています」のような薄い要約は書かない
3. detailedは1500字以上書く。短くまとめようとしない。内容の濃さが最重要
4. 各chaptersのsummaryは300字以上書く
5. 具体的な数字・手順・事例を最大限拾い上げる
6. 読んだ人がすぐ実践できるレベルの具体性を常に意識する`;
}

// ---------------------------------------------------------------------------
// JSON parse
// ---------------------------------------------------------------------------

function parseGeneratedJson(text: string): GeneratedContent & { category?: string } {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonStr.trim());

    if (!parsed.summary || !parsed.blog || !parsed.sns) {
      throw new Error("不完全な JSON 構造");
    }

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
// Main
// ---------------------------------------------------------------------------

export async function generateContent(
  transcript: string,
  meta: VideoMeta,
): Promise<GeneratedContent & { category?: string }> {
  const client = getClient();
  const prompt = buildPrompt(transcript, meta);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
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
