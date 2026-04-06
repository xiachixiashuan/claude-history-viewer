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
  TaskUpdate: "text-tool-task",
  TaskCreate: "text-tool-task",
  ToolSearch: "text-tool-default",
  Glob: "text-tool-default",
};

const TOOL_CARD_STYLES: Record<string, string> = {
  Bash: "bg-tool-bash/5 border-tool-bash/15",
  Agent: "bg-tool-agent/5 border-tool-agent/20",
  Read: "bg-tool-read/5 border-tool-read/15",
  Grep: "bg-tool-grep/5 border-tool-grep/15",
  Edit: "bg-tool-edit/5 border-tool-edit/15",
  Write: "bg-tool-write/5 border-tool-write/15",
  Skill: "bg-tool-skill/5 border-tool-skill/15",
  TaskUpdate: "bg-tool-task/3 border-tool-task/12",
  TaskCreate: "bg-tool-task/3 border-tool-task/12",
};

function summarizeInput(tool: ToolCall): string {
  const { name, input } = tool;
  switch (name) {
    case "Bash":
      return String(input.command ?? "");
    case "Read":
      return `${input.file_path ?? ""}${input.offset ? ` :${input.offset}` : ""}${input.limit ? `-${Number(input.offset ?? 0) + Number(input.limit)}` : ""}`;
    case "Write": {
      const contentLen = String(input.content ?? "").split("\n").length;
      return `${input.file_path ?? ""} · ${contentLen} lines`;
    }
    case "Edit":
      return `${input.file_path ?? ""}${input.replace_all === true || input.replace_all === "true" ? " · replace all" : ""}`;
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
    case "ToolSearch":
      return String(input.query ?? "");
    default:
      return Object.values(input).map((v) => String(v)).join(", ").slice(0, 80);
  }
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
  if (tool.result !== undefined) return { text: "✓", className: "text-diff-add" };
  return { text: "", className: "" };
}

interface ToolCallCardProps {
  tool: ToolCall;
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const icon = getToolIcon(tool.name);
  const status = getStatusLabel(tool);
  const cardStyle = TOOL_CARD_STYLES[tool.name] ?? "bg-white/2 border-white/8";
  const isError = tool.isError;
  const agentModel = tool.name === "Agent" ? String(tool.input.model ?? "") : "";

  return (
    <div
      className={`rounded-md border p-3 my-1.5 backdrop-blur-sm ${
        isError ? "bg-error/4 border-error/20" : cardStyle
      }`}
    >
      <div className="flex items-center gap-2 font-mono">
        <span className="text-xs">{icon}</span>
        <span className={`text-xs font-semibold ${TOOL_NAME_CLASSES[tool.name] ?? "text-tool-default"}`}>
          {tool.name}
        </span>
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
      {/* Edit: show old/new diff from input */}
      {tool.name === "Edit" && tool.input.old_string && (
        <EditDiff
          oldStr={String(tool.input.old_string)}
          newStr={String(tool.input.new_string ?? "")}
        />
      )}
      {/* Write: show content preview from input */}
      {tool.name === "Write" && tool.input.content && (
        <ToolResult
          result={String(tool.input.content)}
          isError={false}
          toolName="Write"
        />
      )}
      {/* Other tools: show result */}
      {tool.name !== "Write" && tool.name !== "Edit" && (
        <ToolResult result={tool.result ?? ""} isError={tool.isError} toolName={tool.name} />
      )}
      {/* Edit: also show result if present (e.g. error) */}
      {tool.name === "Edit" && tool.result && (
        <ToolResult result={tool.result} isError={tool.isError} toolName={tool.name} />
      )}
    </div>
  );
}

function EditDiff({ oldStr, newStr }: { oldStr: string; newStr: string }) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  return (
    <div className="mt-2 p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
      {oldLines.map((line, i) => (
        <div key={`d${i}`} className="text-diff-del">- {line}</div>
      ))}
      {newLines.map((line, i) => (
        <div key={`a${i}`} className="text-diff-add">+ {line}</div>
      ))}
    </div>
  );
}
