import { MessageBlock } from "./MessageBlock";
import type { ParsedMessage, SessionSummary } from "@/lib/types";

interface MessageFlowProps {
  messages: ParsedMessage[];
  summary: SessionSummary | null;
}

export function MessageFlow({ messages, summary }: MessageFlowProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        选择一个对话查看详情
      </div>
    );
  }

  const toolCount = Object.values(summary.toolCallCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <h2 className="font-mono text-sm font-medium text-foreground truncate">
          {summary.firstUserMessage || "Session"}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/20 text-accent font-mono shrink-0">
          {summary.cwd?.split("/").pop() ?? summary.project}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
          {toolCount} tool calls · {summary.messageCount} messages · {summary.sessionId.slice(0, 8)}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg, i) => (
          <MessageBlock key={msg.uuid || `${msg.timestamp}-${i}`} message={msg} />
        ))}
      </div>
    </div>
  );
}
