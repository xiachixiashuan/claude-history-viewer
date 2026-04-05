import { useState } from "react";
import { SessionItem } from "./SessionItem";
import type { SessionSummary } from "@/lib/types";

interface SessionListProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
}

function decodeProjectPath(encoded: string): string {
  // "-Users-wendale-learn-claude-toolbox-v3" → "/Users/wendale/learn/claude-toolbox-v3"
  return encoded.replace(/^-/, "/").replace(/-/g, "/");
}

function getProjectDisplayName(encoded: string): string {
  const decoded = decodeProjectPath(encoded);
  // Show relative to home: ~/learn/claude-toolbox-v3
  const home = decoded.replace(/^\/Users\/[^/]+/, "~");
  return home;
}

export function SessionList({ sessions, activeSessionId, onSelect }: SessionListProps) {
  const groups = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = s.project;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  // Auto-expand group containing active session
  const activeGroup = activeSessionId
    ? sessions.find((s) => s.sessionId === activeSessionId)?.project ?? null
    : null;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    activeGroup ? new Set([activeGroup]) : new Set()
  );

  function toggleGroup(project: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(project)) {
        next.delete(project);
      } else {
        next.add(project);
      }
      return next;
    });
  }

  // When selecting a session, auto-expand its group
  function handleSelect(sessionId: string, project: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.add(project);
      return next;
    });
    onSelect(sessionId);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from(groups.entries()).map(([project, items]) => {
        const isExpanded = expandedGroups.has(project);
        const displayName = getProjectDisplayName(project);

        return (
          <div key={project} className="mb-0.5">
            {/* Project group header — clickable to expand/collapse */}
            <button
              onClick={() => toggleGroup(project)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/2 transition-colors cursor-pointer sticky top-0 bg-background z-10"
            >
              <span
                className={`text-[10px] text-muted-foreground transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              <span className="text-[11px] text-card-foreground font-mono font-medium truncate">
                {displayName}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
                {items.length} 对话
              </span>
            </button>

            {/* Session items — only shown when expanded */}
            {isExpanded &&
              items.map((s) => (
                <SessionItem
                  key={s.sessionId}
                  session={s}
                  isActive={s.sessionId === activeSessionId}
                  onClick={() => handleSelect(s.sessionId, project)}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
