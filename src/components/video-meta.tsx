"use client";

import type { VideoMeta as VideoMetaType, Platform } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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
}

export function VideoMeta({ meta }: VideoMetaProps) {
  const platform = PLATFORM_STYLES[meta.platform];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
      {meta.thumbnail && (
        <img
          src={meta.thumbnail}
          alt={meta.title}
          className="h-16 w-28 shrink-0 rounded object-cover"
        />
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="truncate text-sm font-medium text-foreground">
          {meta.title}
        </h2>
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
