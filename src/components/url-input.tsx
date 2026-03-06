"use client";

import { Play, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function UrlInput({
  url,
  onUrlChange,
  onSubmit,
  isProcessing,
}: UrlInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isProcessing && url.trim()) onSubmit();
      }}
      className="flex gap-3"
    >
      <Input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="YouTube・Loom・UTAGEのURLを貼り付け..."
        disabled={isProcessing}
        aria-label="動画URL"
        className="h-12 flex-1 rounded-md border-2 border-border bg-surface text-foreground placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-copper text-sm"
      />
      <Button
        type="submit"
        disabled={isProcessing || !url.trim()}
        aria-label={isProcessing ? "処理中" : "蒸留を開始"}
        className="h-12 rounded-md bg-copper px-6 text-sm font-medium text-white hover:bg-copper-hover disabled:opacity-50 transition-opacity duration-100"
      >
        {isProcessing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Distilling...</span>
          </>
        ) : (
          <>
            <Play className="size-4" />
            <span>Distill</span>
          </>
        )}
      </Button>
    </form>
  );
}
