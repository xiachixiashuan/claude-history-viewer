import { useState } from "react";
import { getToolIcon, getToolColor } from "@/lib/types";

interface ToolStatsProps {
  toolCounts: Record<string, number>;
  onNavigate: (toolName: string, direction: "next" | "prev") => void;
}

export function ToolStats({ toolCounts, onNavigate }: ToolStatsProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const entries = Object.entries(toolCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  function handleClick(toolName: string) {
    setActiveTool(toolName);
    onNavigate(toolName, "next");
  }

  function handlePrev() {
    if (activeTool) onNavigate(activeTool, "prev");
  }

  function handleNext() {
    if (activeTool) onNavigate(activeTool, "next");
  }

  return (
    <div className="px-6 py-2 border-b border-border shrink-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        {entries.map(([name, count]) => (
          <button
            key={name}
            onClick={() => handleClick(name)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono cursor-pointer transition-colors border ${
              activeTool === name
                ? "border-accent/30 bg-accent/5"
                : "border-border hover:border-foreground/15 bg-transparent"
            }`}
          >
            <span className="text-[10px]">{getToolIcon(name)}</span>
            <span style={{ color: getToolColor(name) }}>{name}</span>
            <span className="text-muted-foreground/60">{count}</span>
          </button>
        ))}

        {/* Prev / Next buttons — only show when a tool is active */}
        {activeTool && (
          <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              {getToolIcon(activeTool)} {activeTool}
            </span>
            <button
              onClick={handlePrev}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/5 cursor-pointer text-[10px] font-mono border border-border"
              title="上一个"
            >
              ↑
            </button>
            <button
              onClick={handleNext}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-accent hover:bg-accent/5 cursor-pointer text-[10px] font-mono border border-border"
              title="下一个"
            >
              ↓
            </button>
            <button
              onClick={() => setActiveTool(null)}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-error cursor-pointer text-[10px] border border-border"
              title="清除"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
