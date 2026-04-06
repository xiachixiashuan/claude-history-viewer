import { getToolIcon } from "@/lib/types";
import { ToolResult } from "./ToolResult";
import type { ToolCall } from "@/lib/types";

const TOOL_NAME_CLASSES: Record<string, string> = {
  Bash: "text-tool-bash",
  Agent: "text-tool-agent",
  Read: "text-tool-read",
  Grep: "text-tool-grep",
  Edit: "text-tool-edit",
  Write: "text-tool-write",
  Skill: "text-tool-skill",
  Glob: "text-tool-grep",
  TaskUpdate: "text-tool-task",
  TaskCreate: "text-tool-task",
  TaskGet: "text-tool-task",
  TaskList: "text-tool-task",
  TaskStop: "text-tool-task",
  ToolSearch: "text-tool-default",
  WebFetch: "text-tool-read",
  WebSearch: "text-tool-read",
  TodoWrite: "text-tool-task",
  AskUserQuestion: "text-tool-skill",
};

const TOOL_CARD_STYLES: Record<string, string> = {
  Bash: "bg-tool-bash/5 border-tool-bash/15",
  Agent: "bg-tool-agent/5 border-tool-agent/20",
  Read: "bg-tool-read/5 border-tool-read/15",
  Grep: "bg-tool-grep/5 border-tool-grep/15",
  Edit: "bg-tool-edit/5 border-tool-edit/15",
  Write: "bg-tool-write/5 border-tool-write/15",
  Skill: "bg-tool-skill/5 border-tool-skill/15",
  Glob: "bg-tool-grep/5 border-tool-grep/15",
  TaskUpdate: "bg-tool-task/3 border-tool-task/12",
  TaskCreate: "bg-tool-task/3 border-tool-task/12",
  TaskGet: "bg-tool-task/3 border-tool-task/12",
  TaskList: "bg-tool-task/3 border-tool-task/12",
  TaskStop: "bg-tool-task/3 border-tool-task/12",
  TodoWrite: "bg-tool-task/3 border-tool-task/12",
  ToolSearch: "bg-white/2 border-white/8",
  WebFetch: "bg-tool-read/5 border-tool-read/15",
  WebSearch: "bg-tool-read/5 border-tool-read/15",
  AskUserQuestion: "bg-tool-skill/5 border-tool-skill/15",
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function summarizeInput(tool: ToolCall): string {
  const { name, input } = tool;
  switch (name) {
    case "Bash":
      return String(input.command ?? "");
    case "Read":
      return `${input.file_path ?? ""}${input.offset ? ` :${input.offset}` : ""}${input.limit ? `-${Number(input.offset ?? 0) + Number(input.limit)}` : ""}`;
    case "Write":
      return String(input.file_path ?? "");
    case "Edit":
      return String(input.file_path ?? "");
    case "Grep":
      return `pattern: "${input.pattern ?? ""}"${input.path ? ` in ${input.path}` : ""}`;
    case "Glob":
      return `${input.pattern ?? ""}${input.path ? ` in ${input.path}` : ""}`;
    case "Agent":
      return String(input.description ?? input.prompt ?? "").slice(0, 100);
    case "Skill":
      return String(input.skill ?? "");
    case "TaskUpdate":
      return `Task #${input.taskId ?? ""} → ${input.status ?? ""}`;
    case "TaskCreate":
      return String(input.subject ?? "");
    case "TaskGet":
      return `Task #${input.taskId ?? ""}`;
    case "TaskList":
      return "list tasks";
    case "TaskStop":
      return `Task #${input.taskId ?? ""}`;
    case "ToolSearch":
      return String(input.query ?? "");
    case "WebFetch":
      return String(input.url ?? "");
    case "WebSearch":
      return String(input.query ?? "");
    case "TodoWrite":
      return String(input.todos ?? "");
    case "AskUserQuestion":
      return String(input.question ?? "");
    default:
      // MCP tools and unknown
      return Object.entries(input)
        .map(([k, v]) => `${k}: ${truncate(String(v), 60)}`)
        .join(", ")
        .slice(0, 120);
  }
}

/** For Edit: render inline diff of old_string → new_string */
function EditDiffPreview({ input }: { input: Record<string, unknown> }) {
  const oldStr = String(input.old_string ?? "");
  const newStr = String(input.new_string ?? "");
  if (!oldStr && !newStr) return null;

  return (
    <div className="mt-2 p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all max-h-[160px] overflow-y-auto">
      {oldStr.split("\n").map((line, i) => (
        <div key={`d${i}`} className="text-diff-del">- {line}</div>
      ))}
      {newStr.split("\n").map((line, i) => (
        <div key={`a${i}`} className="text-diff-add">+ {line}</div>
      ))}
    </div>
  );
}

/** For Write: show content preview */
function WriteContentPreview({ input }: { input: Record<string, unknown> }) {
  const content = String(input.content ?? "");
  if (!content) return null;
  const lines = content.split("\n");
  const preview = lines.slice(0, 8).join("\n");
  const more = lines.length > 8 ? `\n… (${lines.length} lines total)` : "";

  return (
    <div className="mt-2 p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all max-h-[120px] overflow-y-auto text-muted-foreground/70">
      {preview}{more}
    </div>
  );
}

function getStatusLabel(tool: ToolCall): { text: string; className: string } {
  if (tool.isError) return { text: "✗ error", className: "text-error" };
  if (tool.name === "Grep" && tool.result) {
    const lines = tool.result.split("\n").filter((l) => l.trim()).length;
    return { text: `✓ ${lines} matches`, className: "text-diff-add" };
  }
  if (tool.name === "Read" && tool.result) {
    const lines = tool.result.split("\n").length;
    return { text: `✓ ${lines} lines`, className: "text-diff-add" };
  }
  if (tool.name === "Edit") {
    const replaceAll = tool.input.replace_all;
    if (replaceAll) return { text: "✓ replace all", className: "text-diff-add" };
    return { text: "✓", className: "text-diff-add" };
  }
  if (tool.result !== undefined) return { text: "✓", className: "text-diff-add" };
  return { text: "", className: "" };
}

function getToolNameClass(name: string): string {
  if (name.startsWith("mcp__")) return "text-tool-skill";
  return TOOL_NAME_CLASSES[name] ?? "text-tool-default";
}

function getCardStyle(name: string): string {
  if (name.startsWith("mcp__")) return "bg-tool-skill/5 border-tool-skill/15";
  return TOOL_CARD_STYLES[name] ?? "bg-white/2 border-white/8";
}

/** Shorten MCP tool names: mcp__plugin_telegram_telegram__reply → telegram:reply */
function displayToolName(name: string): string {
  if (!name.startsWith("mcp__")) return name;
  const parts = name.replace(/^mcp__/, "").split("__");
  return parts[parts.length - 1] ?? name;
}

interface ToolCallCardProps {
  tool: ToolCall;
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const icon = getToolIcon(tool.name);
  const status = getStatusLabel(tool);
  const cardStyle = getCardStyle(tool.name);
  const isError = tool.isError;
  const agentModel = tool.name === "Agent" ? String(tool.input.model ?? "") : "";
  const isEdit = tool.name === "Edit";
  const isWrite = tool.name === "Write";

  return (
    <div
      className={`rounded-md border p-3 my-1.5 backdrop-blur-sm ${
        isError ? "bg-error/4 border-error/20" : cardStyle
      }`}
    >
      <div className="flex items-center gap-2 font-mono">
        <span className="text-xs">{icon}</span>
        <span className={`text-xs font-semibold ${getToolNameClass(tool.name)}`}>
          {displayToolName(tool.name)}
        </span>
        {tool.name.startsWith("mcp__") && (
          <span className="text-[9px] px-1.5 py-px rounded-md border border-tool-skill/30 text-tool-skill font-mono">
            MCP
          </span>
        )}
        {agentModel && (
          <span className="text-[9px] px-1.5 py-px rounded-md border border-tool-agent/30 text-tool-agent font-mono">
            {agentModel}
          </span>
        )}
        {status.text && (
          <span className={`text-[10px] ${status.className}`}>{status.text}</span>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5 font-mono break-all whitespace-pre-wrap">
        {summarizeInput(tool)}
      </div>
      {/* Edit: show inline diff of old → new */}
      {isEdit && <EditDiffPreview input={tool.input} />}
      {/* Write: show content preview */}
      {isWrite && <WriteContentPreview input={tool.input} />}
      {/* Tool result (skip for Edit/Write which show their own previews) */}
      {!isEdit && !isWrite && (
        <ToolResult result={tool.result ?? ""} isError={tool.isError} toolName={tool.name} />
      )}
    </div>
  );
}
