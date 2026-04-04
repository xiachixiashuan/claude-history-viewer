import type { SessionSummary } from "@/lib/types";
import { getToolColor } from "@/lib/types";

interface SessionItemProps {
  session: SessionSummary;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${min}`;
}

export function SessionItem({ session, isActive, onClick }: SessionItemProps) {
  const toolCount = Object.values(session.toolCallCounts).reduce((a, b) => a + b, 0);
  const toolTypes = Object.keys(session.toolCallCounts);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 border-l-2 transition-all cursor-pointer ${
        isActive
          ? "bg-accent/4 border-l-accent"
          : "border-l-transparent hover:bg-white/2"
      }`}
    >
      <div className="text-xs text-card-foreground truncate mb-1">
        {session.firstUserMessage || "Empty session"}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
        <span>{formatTime(session.endTimestamp)}</span>
        <span>·</span>
        <span>{toolCount} tools</span>
        <div className="flex gap-1 ml-auto">
          {toolTypes.slice(0, 4).map((t) => (
            <div
              key={t}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: getToolColor(t) }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
