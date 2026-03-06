"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SnsContent } from "@/types";

interface CopyButtonProps {
  text: string;
  label: string;
}

function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "コピーしました" : `${label}をコピー`}
      className="gap-1 text-xs text-text-secondary hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-success" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </Button>
  );
}

interface SnsCardProps {
  platform: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SnsCard({ platform, icon, children }: SnsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {icon}
        <span className="text-sm font-medium text-foreground">{platform}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Simple SVG icons for platforms (no external dependency needed)
function XIcon() {
  return (
    <svg className="size-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="size-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="size-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface SnsViewProps {
  sns: SnsContent;
}

export function SnsView({ sns }: SnsViewProps) {
  return (
    <ScrollArea className="max-h-[600px]">
      <div className="space-y-4">
        {/* X (Twitter) */}
        <SnsCard platform="X" icon={<XIcon />}>
          <div className="space-y-3">
            {sns.twitter.map((tweet, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-surface p-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="mb-1 inline-block text-xs text-text-muted">
                    {i + 1}/{sns.twitter.length}
                  </span>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {tweet}
                  </p>
                  <span className="mt-2 inline-block text-xs tabular-nums text-text-muted">
                    {tweet.length}字
                  </span>
                </div>
                <CopyButton text={tweet} label={`ツイート${i + 1}`} />
              </div>
            ))}
          </div>
        </SnsCard>

        {/* Instagram */}
        <SnsCard platform="Instagram" icon={<InstagramIcon />}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {sns.instagram}
              </p>
              <span className="mt-2 inline-block text-xs tabular-nums text-text-muted">
                {sns.instagram.length}/2,200
              </span>
            </div>
            <CopyButton text={sns.instagram} label="Instagram" />
          </div>
        </SnsCard>

        {/* LinkedIn */}
        <SnsCard platform="LinkedIn" icon={<LinkedInIcon />}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {sns.linkedin}
              </p>
              <span className="mt-2 inline-block text-xs tabular-nums text-text-muted">
                {sns.linkedin.length}/3,000
              </span>
            </div>
            <CopyButton text={sns.linkedin} label="LinkedIn" />
          </div>
        </SnsCard>
      </div>
    </ScrollArea>
  );
}
