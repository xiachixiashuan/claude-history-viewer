import { SessionItem } from "./SessionItem";
import type { SessionSummary } from "@/lib/types";

interface SessionListProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelect }: SessionListProps) {
  const groups = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = s.project;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from(groups.entries()).map(([project, items]) => {
        const parts = project.replace(/^-/, "").split("-");
        const shortName = parts[parts.length - 1] || project;

        return (
          <div key={project} className="mb-1">
            <div className="sticky top-0 bg-background z-10 px-4 py-1.5 text-[10px] text-muted-foreground font-mono font-medium tracking-wider uppercase">
              {shortName}
            </div>
            {items.map((s) => (
              <SessionItem
                key={s.sessionId}
                session={s}
                isActive={s.sessionId === activeSessionId}
                onClick={() => onSelect(s.sessionId)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
