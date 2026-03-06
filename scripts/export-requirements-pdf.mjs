#!/usr/bin/env node
/**
 * Markdown要件定義書 → 印刷用HTML変換スクリプト
 * 使い方: node scripts/export-requirements-pdf.mjs
 * 生成されたHTMLをブラウザで開き、印刷(Cmd+P) → PDFで保存
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Read markdown files
const reqMd = readFileSync(join(ROOT, "docs/requirements/requirements.md"), "utf-8");
const designMd = readFileSync(join(ROOT, "docs/requirements/design-requirements.md"), "utf-8");

// Simple markdown to HTML converter (no dependencies)
function mdToHtml(md) {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="lang-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, header, sep, body) => {
    const ths = header.split("|").filter(Boolean).map(c => `<th>${c.trim()}</th>`).join("");
    const rows = body.trim().split("\n").map(row => {
      const tds = row.split("|").filter(Boolean).map(c => `<td>${c.trim()}</td>`).join("");
      return `<tr>${tds}</tr>`;
    }).join("\n");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headers
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr />");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Checkbox lists
  html = html.replace(/^(\s*)- \[x\] (.+)$/gm, '$1<div class="checkbox checked">$2</div>');
  html = html.replace(/^(\s*)- \[ \] (.+)$/gm, '$1<div class="checkbox">$2</div>');

  // Unordered lists
  html = html.replace(/^(\s*)- (.+)$/gm, "$1<li>$2</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Ordered lists
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, "$1<li>$2</li>");

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // Paragraphs (lines that aren't already HTML)
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, "<p>$1</p>");

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, "");

  return html;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const date = new Date().toLocaleDateString("ja-JP", {
  year: "numeric", month: "2-digit", day: "2-digit",
});

const outputHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>Distill - 要件定義書</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
      color: #1a1a1a;
      line-height: 1.7;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
      font-size: 13px;
    }
    .cover {
      text-align: center;
      padding: 80px 0 60px;
      border-bottom: 2px solid #c2824a;
      margin-bottom: 40px;
      page-break-after: always;
    }
    .cover h1 {
      font-size: 42px;
      color: #c2824a;
      margin-bottom: 8px;
      letter-spacing: 4px;
    }
    .cover .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    .cover .meta {
      font-size: 12px;
      color: #999;
    }
    h1 { font-size: 22px; color: #c2824a; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #c2824a; }
    h2 { font-size: 17px; color: #333; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e0e0e0; }
    h3 { font-size: 14px; color: #444; margin: 20px 0 8px; }
    h4 { font-size: 13px; color: #555; margin: 16px 0 6px; }
    p { margin-bottom: 8px; }
    ul, ol { margin: 8px 0 8px 20px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th { background: #f5f5f4; text-align: left; padding: 8px; border: 1px solid #ddd; font-weight: 600; }
    td { padding: 8px; border: 1px solid #ddd; }
    pre { background: #f5f5f4; padding: 12px; border-radius: 4px; margin: 12px 0; overflow-x: auto; font-size: 11px; }
    code { font-family: "SF Mono", "Menlo", monospace; font-size: 12px; background: #f5f5f4; padding: 1px 4px; border-radius: 2px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #c2824a; padding: 8px 16px; margin: 12px 0; color: #555; background: #faf9f5; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
    .checkbox { padding: 2px 0 2px 24px; position: relative; }
    .checkbox::before { content: "\\2610"; position: absolute; left: 0; }
    .checkbox.checked::before { content: "\\2611"; color: #4a9d6e; }
    .section-divider { page-break-before: always; }
    strong { color: #333; }
    @media print {
      body { padding: 0; font-size: 11px; }
      h1 { font-size: 18px; }
      h2 { font-size: 15px; }
      pre { font-size: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1 style="border:none; color:#c2824a; font-size:42px;">DISTILL</h1>
    <p class="subtitle">要件定義書 + デザイン要件</p>
    <p class="meta">
      Version 1.0<br />
      作成日: ${date}<br />
      動画から、要点だけを取り出す
    </p>
  </div>

  <div class="no-print" style="background:#c2824a15; padding:12px 16px; border-radius:6px; margin-bottom:24px; font-size:13px;">
    このページをPDFで保存するには: <strong>Cmd + P</strong> (Mac) / <strong>Ctrl + P</strong> (Win) → 「PDFとして保存」
  </div>

  ${mdToHtml(reqMd)}

  <div class="section-divider"></div>

  ${mdToHtml(designMd)}
</body>
</html>`;

const outputPath = join(ROOT, "docs/requirements/requirements.html");
writeFileSync(outputPath, outputHtml, "utf-8");

console.log(`Generated: ${outputPath}`);
console.log("Open in browser and print (Cmd+P) to save as PDF.");
