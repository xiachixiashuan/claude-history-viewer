import { RoleBar } from "./RoleBar";
import { TextContent } from "./TextContent";
import { ToolCallCard } from "./ToolCallCard";
import type { ParsedMessage } from "@/lib/types";

interface MessageBlockProps {
  message: ParsedMessage;
}

export function MessageBlock({ message }: MessageBlockProps) {
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
        {message.toolCalls?.map((tc) => (
          <ToolCallCard key={tc.id} tool={tc} />
        ))}
      </div>
    </div>
  );
}
