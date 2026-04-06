import { useState } from "react";

interface ToolResultProps {
  result: string;
  isError?: boolean;
  toolName: string;
}

const MAX_LINES = 12;

export function ToolResult({ result, isError, toolName }: ToolResultProps) {
  if (!result) return null;

  const isEdit = toolName === "Edit";
  const lines = result.split("\n");
  const isLong = lines.length > MAX_LINES;
  const [expanded, setExpanded] = useState(false);

  const displayText = isLong && !expanded
    ? lines.slice(0, MAX_LINES).join("\n")
    : result;

  return (
    <div className="mt-2 relative">
      <div
        className={`p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all ${
          isError ? "border-l-2 border-l-error/30" : ""
        } ${isLong && !expanded ? "max-h-[140px] overflow-hidden" : "max-h-[400px] overflow-y-auto"}`}
      >
        {isEdit ? <DiffView text={displayText} /> : <span className="text-muted-foreground/70">{displayText}</span>}
      </div>
      {isLong && !expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/40 to-transparent rounded-b flex items-end justify-center pb-1">
          <button
            onClick={() => setExpanded(true)}
            className="text-[9px] text-accent/70 hover:text-accent font-mono cursor-pointer"
          >
            展开全部 ({lines.length} 行)
          </button>
        </div>
      )}
      {isLong && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-1 text-[9px] text-accent/70 hover:text-accent font-mono cursor-pointer"
        >
          收起
        </button>
      )}
    </div>
  );
}

function DiffView({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("+") || line.startsWith("> ")) {
          return <div key={i} className="text-diff-add">{line}</div>;
        }
        if (line.startsWith("-") || line.startsWith("< ")) {
          return <div key={i} className="text-diff-del">{line}</div>;
        }
        return <div key={i} className="text-muted-foreground/70">{line}</div>;
      })}
    </>
  );
}
