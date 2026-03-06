"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DistillResult } from "@/types";

interface PdfButtonProps {
  result: DistillResult;
}

export function PdfButton({ result }: PdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePdf = async () => {
    setLoading(true);

    try {
      // Build a printable document
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("ポップアップがブロックされました。許可してください。");
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="utf-8" />
          <title>${result.meta.title} - Distill</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
              color: #1a1a1a;
              line-height: 1.8;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #e2e2e0; padding-bottom: 8px; }
            h3 { font-size: 15px; margin-top: 20px; margin-bottom: 8px; }
            p { margin-bottom: 12px; font-size: 14px; }
            .meta { color: #6a6a68; font-size: 12px; margin-bottom: 24px; }
            .section { margin-bottom: 32px; }
            .transcript { font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #f5f5f4; padding: 16px; border-radius: 4px; }
            .chapter { background: #f5f5f4; padding: 12px; border-radius: 4px; margin-bottom: 8px; }
            .chapter-num { display: inline-block; width: 24px; height: 24px; background: #c2824a20; color: #c2824a; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 8px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${result.meta.title}</h1>
          <p class="meta">${result.meta.channel} | ${result.meta.duration} | ${result.meta.platform.toUpperCase()}</p>

          <div class="section">
            <h2>要約</h2>
            <p>${result.summary.oneliner}</p>
          </div>

          <div class="section">
            <h2>詳細要約</h2>
            <p>${result.summary.detailed.replace(/\n/g, "<br />")}</p>
          </div>

          ${
            result.summary.chapters.length > 0
              ? `
          <div class="section">
            <h2>章立て要約</h2>
            ${result.summary.chapters
              .map(
                (c, i) => `
              <div class="chapter">
                <h3><span class="chapter-num">${i + 1}</span>${c.title}</h3>
                <p>${c.summary}</p>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          <div class="section">
            <h2>ブログ記事</h2>
            <h3>${result.blog.title}</h3>
            <p>${result.blog.content.replace(/\n/g, "<br />")}</p>
          </div>

          <div class="section">
            <h2>全文書き起こし</h2>
            <div class="transcript">${result.transcript}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handlePdf}
      disabled={loading}
      aria-label={loading ? "PDF生成中" : "PDFをダウンロード"}
      className="gap-1.5 text-xs text-text-secondary hover:text-foreground"
    >
      {loading ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          PDF生成中...
        </>
      ) : (
        <>
          <Download className="size-3.5" />
          PDF
        </>
      )}
    </Button>
  );
}
