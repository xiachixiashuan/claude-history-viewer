import { useState } from "react";

interface TextContentProps {
  text: string;
  role: "user" | "assistant" | "system";
}

// Strip all XML-like tags injected by Claude Code system
function cleanText(text: string): string {
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<command-[^>]*>[\s\S]*?<\/command-[^>]*>/g, "")
    .replace(/<local-command-[^>]*>[\s\S]*?<\/local-command-[^>]*>/g, "")
    .replace(/<EXTREMELY_IMPORTANT>[\s\S]*?<\/EXTREMELY_IMPORTANT>/g, "")
    .replace(/<EXTREMELY-IMPORTANT>[\s\S]*?<\/EXTREMELY-IMPORTANT>/g, "")
    .replace(/<HARD-GATE>[\s\S]*?<\/HARD-GATE>/g, "")
    .replace(/<SUBAGENT-STOP>[\s\S]*?<\/SUBAGENT-STOP>/g, "")
    .replace(/<\/?[A-Z][A-Z_-]*>/g, "")
    .replace(/<channel[^>]*>[\s\S]*?<\/channel>/g, "")
    .replace(/<new-diagnostics>[\s\S]*?<\/new-diagnostics>/g, "")
    .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, "")
    .replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, "")
    .trim();
}

// Detect skill injection messages
function isSkillInjection(text: string): boolean {
  return text.startsWith("Base directory for this skill:") ||
    text.startsWith("Launching skill:");
}

// Simple markdown-to-HTML renderer
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/30 rounded p-2 my-1 overflow-x-auto text-[10px]"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/5 px-1 rounded text-[10px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<div class="text-foreground font-semibold mt-2 mb-1">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-foreground font-semibold text-sm mt-2 mb-1">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="text-foreground font-bold text-sm mt-2 mb-1">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="pl-3">· $1</div>')
    .replace(/^\* (.+)$/gm, '<div class="pl-3">· $1</div>');
}

const MAX_LINES = 8;

export function TextContent({ text, role }: TextContentProps) {
  if (!text.trim()) return null;

  const cleaned = cleanText(text);
  if (!cleaned) return null;

  // Collapse skill injection messages
  const isSkill = isSkillInjection(cleaned);
  const [expanded, setExpanded] = useState(false);

  if (isSkill && !expanded) {
    const firstLine = cleaned.split("\n")[0];
    return (
      <div className="text-xs py-1.5 px-3 text-muted-foreground/50 font-mono flex items-center gap-2">
        <span className="text-tool-skill">⚙</span>
        <span className="truncate">{firstLine}</span>
        <button
          onClick={() => setExpanded(true)}
          className="text-[9px] text-accent/50 hover:text-accent shrink-0 cursor-pointer"
        >
          展开
        </button>
      </div>
    );
  }

  // For long user messages, add collapse
  const lines = cleaned.split("\n");
  const isLong = role === "user" && lines.length > MAX_LINES;
  const [textExpanded, setTextExpanded] = useState(false);

  const displayText = isLong && !textExpanded
    ? lines.slice(0, MAX_LINES).join("\n")
    : cleaned;

  const baseClass = "text-xs leading-relaxed py-2 px-3";
  const roleClass = role === "user"
    ? "text-card-foreground bg-accent/3 rounded font-mono whitespace-pre-wrap"
    : "text-muted-foreground";

  if (role === "assistant") {
    const html = renderMarkdown(cleaned);
    return (
      <div
        className={`${baseClass} ${roleClass}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="relative">
      <div className={`${baseClass} ${roleClass} whitespace-pre-wrap ${isLong && !textExpanded ? "max-h-[120px] overflow-hidden" : ""}`}>
        {displayText}
      </div>
      {isLong && !textExpanded && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent flex items-end justify-center pb-1">
          <button
            onClick={() => setTextExpanded(true)}
            className="text-[9px] text-accent/70 hover:text-accent font-mono cursor-pointer"
          >
            展开全部 ({lines.length} 行)
          </button>
        </div>
      )}
      {isLong && textExpanded && (
        <button
          onClick={() => setTextExpanded(false)}
          className="ml-3 mb-1 text-[9px] text-accent/70 hover:text-accent font-mono cursor-pointer"
        >
          收起
        </button>
      )}
    </div>
  );
}
