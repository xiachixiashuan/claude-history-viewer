import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { MessageFlow } from "./components/message/MessageFlow";
import { getSessions, getSessionDetail } from "./lib/api";
import type { SessionSummary, ParsedMessage } from "./lib/types";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [activeSummary, setActiveSummary] = useState<SessionSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toolFilter, setToolFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const fetchSessions = useCallback(async () => {
    try {
      const params: { q?: string; tool?: string } = {};
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (toolFilter !== "All") params.tool = toolFilter;
      const data = await getSessions(params);
      setSessions(data);
      if (!activeSessionId && data.length > 0) {
        setActiveSessionId(data[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, toolFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setActiveSummary(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const detail = await getSessionDetail(activeSessionId);
        if (!cancelled) {
          setMessages(detail.messages);
          setActiveSummary(detail.summary);
        }
      } catch (err) {
        console.error("Failed to fetch session detail:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [activeSessionId]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        toolFilter={toolFilter}
        onToolFilterChange={setToolFilter}
      />
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
            Loading...
          </div>
        ) : (
          <MessageFlow messages={messages} summary={activeSummary} />
        )}
      </main>
    </div>
  );
}
