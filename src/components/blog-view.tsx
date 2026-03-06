"use client";

import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Blog } from "@/types";

/** Simple markdown to HTML converter */
function markdownToHtml(md: string): string {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks -> paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)(\s*<li>)/g, "$1$2");
  html = html.replace(/(?<!<\/ul>)(<li>)/g, "<ul>$1");
  html = html.replace(/(<\/li>)(?![\s]*<li>)/g, "$1</ul>");

  return `<p>${html}</p>`;
}

interface BlogViewProps {
  blog: Blog;
}

export function BlogView({ blog }: BlogViewProps) {
  const [copied, setCopied] = useState(false);
  const htmlContent = useMemo(() => markdownToHtml(blog.content), [blog.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`# ${blog.title}\n\n${blog.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? "コピーしました" : "Markdownをコピー"}
        className="absolute right-0 top-0 z-10 gap-1.5 text-xs text-text-secondary hover:text-foreground"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-success" />
            コピーしました
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Markdownをコピー
          </>
        )}
      </Button>

      <ScrollArea className="max-h-[600px]">
        <article className="prose pr-24">
          <h1>{blog.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </article>
      </ScrollArea>
    </div>
  );
}
