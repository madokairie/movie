"use client";

import { useState, useRef, useEffect } from "react";
import type { VideoMeta as VideoMetaType, Platform } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check } from "lucide-react";

const PLATFORM_STYLES: Record<Platform, { label: string; className: string }> =
  {
    youtube: {
      label: "YouTube",
      className: "bg-[#cc0000]/15 text-[#cc0000] border-[#cc0000]/20",
    },
    loom: {
      label: "Loom",
      className: "bg-[#625df5]/15 text-[#625df5] border-[#625df5]/20",
    },
    utage: {
      label: "UTAGE",
      className: "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/20",
    },
    generic: {
      label: "Video",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

interface VideoMetaProps {
  meta: VideoMetaType;
  historyId?: string;
  onTitleChange?: (newTitle: string) => void;
}

export function VideoMeta({ meta, historyId, onTitleChange }: VideoMetaProps) {
  const platform = PLATFORM_STYLES[meta.platform];
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(meta.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(meta.title);
      setEditing(false);
      return;
    }

    setEditing(false);

    if (trimmed !== meta.title) {
      onTitleChange?.(trimmed);

      if (historyId) {
        try {
          await fetch("/api/history", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: historyId, title: trimmed }),
          });
        } catch {
          // silently fail
        }
      }
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
      {meta.thumbnail && (
        <img
          src={meta.thumbnail}
          alt={title}
          className="h-16 w-28 shrink-0 rounded object-cover"
        />
      )}

      <div className="min-w-0 flex-1 space-y-1">
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === "Escape") { setTitle(meta.title); setEditing(false); } }}
              className="w-full rounded border border-copper/50 bg-background px-2 py-1 text-sm font-medium text-foreground outline-none focus:border-copper"
            />
            <button type="submit" className="shrink-0 text-copper hover:text-copper-hover">
              <Check className="size-4" />
            </button>
          </form>
        ) : (
          <div className="group flex items-center gap-2">
            <h2 className="truncate text-sm font-medium text-foreground">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 text-text-secondary opacity-0 transition-opacity duration-150 hover:text-copper group-hover:opacity-100"
              aria-label="タイトルを編集"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span>{meta.channel}</span>
          <span aria-hidden="true">|</span>
          <span>{meta.duration}</span>
        </div>
      </div>

      <Badge variant="outline" className={`shrink-0 ${platform.className}`}>
        {platform.label}
      </Badge>
    </div>
  );
}
