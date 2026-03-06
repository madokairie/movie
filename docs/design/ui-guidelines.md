# Distill - UI Guidelines

## Aesthetic Direction

**Tone**: Minimal-Industrial
**Mood**: 知的・クリーン・信頼感
**Concept**: 蒸留所のような洗練された空間

## Differentiation

ダーク基調に銅色（#c2824a）のアクセント。蒸留器の持つ機能美をUIに落とし込む。
余白を贅沢に使い、情報密度を適切にコントロール。ツールとしての信頼感と、使っていて心地よい質感を両立する。

---

## Typography Guidelines

### Principles

- 見出しにセリフ体（Instrument Serif）で品格を
- 本文にGeistでモダンな可読性
- 文字起こしテキストはGeist Monoで「原文」感を演出

### Application

| 要素 | フォント | サイズ | ウェイト |
|------|---------|--------|---------|
| アプリ名「Distill」 | Instrument Serif | 2.5rem | 400 |
| セクション見出し | Instrument Serif | 1.75rem | 400 |
| タブラベル | Geist | 0.875rem | 600 |
| 本文 | Geist | 1rem | 400 |
| 文字起こしテキスト | Geist Mono | 0.9rem | 400 |
| メタ情報 | Geist | 0.875rem | 400 |
| ボタン | Geist | 0.875rem | 500 |

### 禁止

- Inter, Roboto, Arial は使用しない
- 過剰な太字（700+）は見出し以外で使用しない

---

## Color Guidelines

### Principles

- ダークモードをデフォルトとし、コンテンツを引き立てる
- 銅色アクセントは控えめに使用（ボタン、アクティブタブ、リンク）
- テキストは3段階（primary / secondary / muted）で階層を作る

### 使い分け

| 要素 | Dark Mode | Light Mode |
|------|-----------|------------|
| 背景 | #0a0a0b | #fafaf9 |
| カード | #161618 | #f5f5f4 |
| ボーダー | #2a2a2c | #e2e2e0 |
| アクティブタブ | #c2824a | #c2824a |
| テキスト（主） | #e8e8e6 | #1a1a1a |
| テキスト（副） | #8a8a88 | #6a6a68 |

### 禁止

- 紫グラデーション
- ネオン・グロー効果
- グラデーション背景

---

## Layout Guidelines

### メイン画面構成

```
┌─ Header ─────────────────────────────────┐
│  [Distill logo]              [Theme Toggle] │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ Input Section ──────────────────┐    │
│  │  URL入力 + Distillボタン          │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ Meta Section ───────────────────┐    │
│  │  サムネイル | タイトル | チャンネル  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌─ Content Section ────────────────┐    │
│  │  [Tab Bar]        [PDF Button]    │    │
│  │  ┌──────────────────────────┐    │    │
│  │  │                          │    │    │
│  │  │  Tab Content             │    │    │
│  │  │                          │    │    │
│  │  └──────────────────────────┘    │    │
│  └──────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

### 余白

- セクション間: 48px (2xl)
- コンポーネント間: 24px (lg)
- 内部パディング: 16px〜24px (md〜lg)
- コンテンツ最大幅: 1200px、中央寄せ

---

## Component Guidelines

### URL入力フィールド

- 高さ: 48px
- ボーダー: 1px solid border色
- フォーカス時: primary色のリング（2px）
- プレースホルダー: "YouTubeやLoomのURLを貼り付け..."
- 角丸: 6px

### Distillボタン

- 背景: primary (#c2824a)
- テキスト: 白
- ホバー: primary_hover (#d4956a)
- 角丸: 6px
- パディング: 12px 24px
- 処理中: スピナー + "Distilling..." テキスト

### タブバー

- アクティブ: 下線（primary色、2px）
- 非アクティブ: text-secondary色
- ホバー: text-primary色にフェード
- 切替アニメーション: 150ms fade

### プログレスバー

- 背景: surface色
- バー: primary色
- 高さ: 4px
- 角丸: full
- ステップラベル: バーの下に表示

### コンテンツエリア

- 背景: surface色
- ボーダー: 1px solid border色
- 角丸: 8px
- パディング: 24px
- テキスト: 行間1.8

---

## Motion Guidelines

### Principles

- 200ms以下のインタラクション
- Compositor props のみ（transform, opacity）
- 意味のあるアニメーションのみ（装飾的なものは不要）

### 適用箇所

| 要素 | アニメーション | Duration |
|------|-------------|----------|
| タブ切替 | コンテンツfade in | 150ms |
| 結果表示 | stagger fade in (上から順に) | 150ms + 50ms stagger |
| プログレス | バー幅の変化 | 300ms |
| ボタンホバー | 背景色変化 | 100ms |
| テーマ切替 | 全体のカラー遷移 | 200ms |

### 禁止

- バウンスアニメーション
- レイアウトプロパティ（width, height, margin）のアニメーション
- 3秒以上のアニメーション
- 自動再生のアニメーション

---

## Accessibility

- すべてのインタラクティブ要素にaria-labelを付与
- タブはキーボード操作（←→）で切替可能
- フォーカスリングは常に可視
- カラーだけに依存しない情報伝達
- スクリーンリーダー対応のプログレス通知（aria-live）
