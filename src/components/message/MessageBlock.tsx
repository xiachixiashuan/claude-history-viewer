import { RoleBar } from "./RoleBar";
import { TextContent, cleanText } from "./TextContent";
import { ToolCallCard } from "./ToolCallCard";
import type { ParsedMessage } from "@/lib/types";

interface MessageBlockProps {
  message: ParsedMessage;
  toolStartIdx?: number;
}

export function MessageBlock({ message, toolStartIdx = 0 }: MessageBlockProps) {
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const cleanedText = cleanText(message.textContent);

  // Skip messages with no visible content
  if (!cleanedText && !hasToolCalls) return null;

  return (
    <div className="mb-4">
      <RoleBar
        role={message.type}
        model={message.model}
        version={message.version}
        timestamp={message.timestamp}
      />
      <div className="pl-3.5 border-l border-white/4">
        <TextContent text={message.textContent} role={message.type} />
        {message.toolCalls?.map((tc, i) => (
          <div key={tc.id} data-tool-idx={toolStartIdx + i} className="transition-colors duration-500">
            <ToolCallCard tool={tc} />
          </div>
        ))}
      </div>
    </div>
  );
}
