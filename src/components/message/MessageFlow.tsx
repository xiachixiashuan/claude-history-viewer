import { useRef, useEffect } from "react";
import { MessageBlock } from "./MessageBlock";
import type { ParsedMessage, SessionSummary } from "@/lib/types";

interface MessageFlowProps {
  messages: ParsedMessage[];
  summary: SessionSummary | null;
  onRefresh?: () => void;
}

export function MessageFlow({ messages, summary, onRefresh }: MessageFlowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when session changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [summary?.sessionId]);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        选择一个对话查看详情
      </div>
    );
  }

  const toolCount = Object.values(summary.toolCallCounts).reduce((a, b) => a + b, 0);
  const title = (summary.firstUserMessage || "Session")
    .replace(/<[^>]+>/g, "")
    .trim() || "Session";

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Session header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <h2 className="font-mono text-sm font-medium text-foreground truncate">
          {title}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/20 text-accent font-mono shrink-0">
          {summary.cwd?.split("/").slice(-2).join("/") ?? summary.project}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
          {toolCount} tool calls · {summary.messageCount} messages · {summary.sessionId.slice(0, 8)}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg, i) => (
          <MessageBlock key={msg.uuid || `${msg.timestamp}-${i}`} message={msg} />
        ))}

        {/* Bottom: refresh button */}
        <div className="flex justify-center py-4">
          <button
            onClick={onRefresh}
            className="text-[10px] text-accent/50 hover:text-accent font-mono cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:border-accent/20 transition-colors"
          >
            ↻ 刷新消息
          </button>
        </div>
      </div>

      {/* Floating scroll buttons */}
      <div className="absolute bottom-6 right-8 flex flex-col gap-2">
        <button
          onClick={scrollToTop}
          className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors cursor-pointer text-xs"
          title="回到顶部"
        >
          ↑
        </button>
        <button
          onClick={scrollToBottom}
          className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors cursor-pointer text-xs"
          title="跳到底部"
        >
          ↓
        </button>
      </div>
    </div>
  );
}
