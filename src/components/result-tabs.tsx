"use client";

import { FileText, ListTree, BookOpen, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TranscriptView } from "@/components/transcript-view";
import { SummaryView } from "@/components/summary-view";
import { BlogView } from "@/components/blog-view";
import { SnsView } from "@/components/sns-view";
import { PdfButton } from "@/components/pdf-button";
import type { DistillResult, ActiveTab } from "@/types";

interface ResultTabsProps {
  result: DistillResult;
  url?: string;
}

export function ResultTabs({ result, url }: ResultTabsProps) {
  return (
    <Tabs defaultValue="transcript" className="w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="overflow-x-auto">
        <TabsList
          variant="line"
          className="h-auto gap-0 bg-transparent p-0"
          aria-label="コンテンツタブ"
        >
          <TabsTrigger
            value="transcript"
            className="whitespace-nowrap gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-foreground data-[state=active]:border-copper data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <FileText className="size-4" />
            全文
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="whitespace-nowrap gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-foreground data-[state=active]:border-copper data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <ListTree className="size-4" />
            要約
          </TabsTrigger>
          <TabsTrigger
            value="blog"
            className="whitespace-nowrap gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-foreground data-[state=active]:border-copper data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <BookOpen className="size-4" />
            ブログ
          </TabsTrigger>
          <TabsTrigger
            value="sns"
            className="whitespace-nowrap gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-foreground data-[state=active]:border-copper data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <Share2 className="size-4" />
            SNS
          </TabsTrigger>
        </TabsList>
        </div>

        <PdfButton result={result} url={url} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-6">
        <TabsContent value="transcript" className="mt-0">
          <TranscriptView transcript={result.transcript} />
        </TabsContent>
        <TabsContent value="summary" className="mt-0">
          <SummaryView summary={result.summary} />
        </TabsContent>
        <TabsContent value="blog" className="mt-0">
          <BlogView blog={result.blog} />
        </TabsContent>
        <TabsContent value="sns" className="mt-0">
          <SnsView sns={result.sns} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
