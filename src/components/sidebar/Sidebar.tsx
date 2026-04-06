import { SearchBox } from "./SearchBox";
import { SessionList } from "./SessionList";
import type { SessionSummary } from "@/lib/types";

interface SidebarProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-sm font-semibold text-accent tracking-wide">
            claude-history
          </span>
        </div>
        <SearchBox value={searchQuery} onChange={onSearchChange} />
      </div>
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={onSelectSession}
      />
    </div>
  );
}
