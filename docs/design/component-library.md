# Distill - Component Library

## shadcn/ui コンポーネント一覧

### 使用コンポーネント

| コンポーネント | 用途 | カスタマイズ |
|-------------|------|------------|
| Button | Distillボタン、PDFボタン | primary色、ローディング状態 |
| Input | URL入力フィールド | 高さ48px、プレースホルダー |
| Tabs | コンテンツ切替 | 下線スタイル、primary色 |
| Card | コンテンツ表示エリア | surface背景、thin border |
| Progress | プログレスバー | primary色、4px高 |
| Badge | プラットフォームラベル | YouTube/Loom/UTAGE識別 |
| Separator | セクション区切り | border色 |
| Skeleton | ローディング状態 | surface色 |
| Toggle | ダークモード切替 | Sun/Moon アイコン |
| ScrollArea | 長文スクロール | カスタムスクロールバー |
| Tooltip | ボタンヒント | コピー完了通知等 |
| DropdownMenu | 要約形式選択 | 3行/詳細/章立て |

### カスタムコンポーネント

| コンポーネント | ファイル | 説明 |
|-------------|---------|------|
| UrlInput | url-input.tsx | URL入力 + バリデーション + Distillボタン |
| ProgressSteps | progress-bar.tsx | ステップ付きプログレス表示 |
| ResultTabs | result-tabs.tsx | 全文/要約/ブログ/SNSタブ |
| TranscriptView | transcript-view.tsx | 全文表示 + コピー機能 |
| SummaryView | summary-view.tsx | 3種要約 + 切替 |
| BlogView | blog-view.tsx | Markdownレンダリング |
| SnsView | sns-view.tsx | SNS別投稿カード |
| PdfButton | pdf-button.tsx | PDF生成 + ダウンロード |
| ThemeToggle | theme-toggle.tsx | ダーク/ライト切替 |
| VideoMeta | video-meta.tsx | 動画メタ情報表示 |

---

## Lucide Icons 使用一覧

| アイコン | 用途 |
|---------|------|
| Play | Distillボタン |
| Download | PDFダウンロード |
| Copy | テキストコピー |
| Check | コピー完了 |
| Sun | ライトモード |
| Moon | ダークモード |
| FileText | 全文タブ |
| ListTree | 要約タブ |
| BookOpen | ブログタブ |
| Share2 | SNSタブ |
| Loader2 | ローディングスピナー |
| AlertCircle | エラー表示 |
| ExternalLink | 元動画リンク |
