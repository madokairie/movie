"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptViewProps {
  transcript: string;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? "コピーしました" : "テキストをコピー"}
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
            コピー
          </>
        )}
      </Button>

      <ScrollArea className="max-h-[600px]">
        <p className="whitespace-pre-wrap pr-24 font-mono text-[0.9rem] leading-[1.8] text-foreground">
          {transcript}
        </p>
      </ScrollArea>
    </div>
  );
}
