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
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  const fetchSessions = useCallback(async () => {
    try {
      const params: { q?: string } = {};
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
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
  }, [debouncedQuery]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const fetchSessionDetail = useCallback(async () => {
    if (!activeSessionId) {
      setMessages([]);
      setActiveSummary(null);
      return;
    }
    try {
      const detail = await getSessionDetail(activeSessionId);
      setMessages(detail.messages);
      setActiveSummary(detail.summary);
    } catch (err) {
      console.error("Failed to fetch session detail:", err);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchSessionDetail();
  }, [fetchSessionDetail]);

  // Sidebar resize handlers
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = Math.max(240, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar with dynamic width */}
      <div style={{ width: sidebarWidth }} className="shrink-0">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize shrink-0 transition-colors hover:bg-accent/20 ${
          isDragging ? "bg-accent/30" : "bg-border"
        }`}
      />

      {/* Main panel */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
            Loading...
          </div>
        ) : (
          <MessageFlow
            messages={messages}
            summary={activeSummary}
            onRefresh={fetchSessionDetail}
          />
        )}
      </main>
    </div>
  );
}
