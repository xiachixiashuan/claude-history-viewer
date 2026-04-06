export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
}

export interface ParsedMessage {
  type: "user" | "assistant" | "system";
  uuid: string;
  timestamp: string;
  textContent: string;
  model?: string;
  version?: string;
  cwd?: string;
  gitBranch?: string;
  toolCalls?: ToolCall[];
}

export interface SessionSummary {
  sessionId: string;
  project: string;
  messageCount: number;
  firstUserMessage: string;
  startTimestamp: string;
  endTimestamp: string;
  toolCallCounts: Record<string, number>;
  model?: string;
  version?: string;
  cwd?: string;
}

export interface ProjectInfo {
  encodedName: string;
  path: string;
  name: string;
  sessionCount: number;
  lastActive: string;
}

export interface SessionDetail {
  messages: ParsedMessage[];
  summary: SessionSummary;
}

export const TOOL_COLORS: Record<string, string> = {
  Bash: "var(--color-tool-bash)",
  Agent: "var(--color-tool-agent)",
  Read: "var(--color-tool-read)",
  Grep: "var(--color-tool-grep)",
  Edit: "var(--color-tool-edit)",
  Write: "var(--color-tool-write)",
  Skill: "var(--color-tool-skill)",
  Glob: "var(--color-tool-grep)",
  TaskUpdate: "var(--color-tool-task)",
  TaskCreate: "var(--color-tool-task)",
  TaskGet: "var(--color-tool-task)",
  TaskList: "var(--color-tool-task)",
  TaskStop: "var(--color-tool-task)",
  ToolSearch: "var(--color-tool-default)",
  WebFetch: "var(--color-tool-read)",
  WebSearch: "var(--color-tool-read)",
  TodoWrite: "var(--color-tool-task)",
  AskUserQuestion: "var(--color-tool-skill)",
};

export const TOOL_ICONS: Record<string, string> = {
  Bash: "⚡",
  Agent: "⬡",
  Read: "📖",
  Grep: "🔍",
  Edit: "✏️",
  Write: "📝",
  Skill: "⚙",
  Glob: "📂",
  TaskUpdate: "📋",
  TaskCreate: "📋",
  TaskGet: "📋",
  TaskList: "📋",
  TaskStop: "📋",
  ToolSearch: "🔧",
  WebFetch: "🌐",
  WebSearch: "🔎",
  TodoWrite: "✅",
  AskUserQuestion: "❓",
};

export function getToolColor(name: string): string {
  // Handle MCP tools (mcp__xxx)
  if (name.startsWith("mcp__")) return "var(--color-tool-skill)";
  return TOOL_COLORS[name] ?? "var(--color-tool-default)";
}

export function getToolIcon(name: string): string {
  if (name.startsWith("mcp__")) return "🔌";
  return TOOL_ICONS[name] ?? "🔧";
}

export function getToolCssClass(name: string): string {
  const map: Record<string, string> = {
    Bash: "tool-bash",
    Agent: "tool-agent",
    Read: "tool-read",
    Grep: "tool-grep",
    Edit: "tool-edit",
    Write: "tool-write",
    Skill: "tool-skill",
    Glob: "tool-grep",
    TaskUpdate: "tool-task",
    TaskCreate: "tool-task",
    TaskGet: "tool-task",
    TaskList: "tool-task",
    TaskStop: "tool-task",
    ToolSearch: "tool-default",
    WebFetch: "tool-read",
    WebSearch: "tool-read",
    TodoWrite: "tool-task",
    AskUserQuestion: "tool-skill",
  };
  if (name.startsWith("mcp__")) return "tool-skill";
  return map[name] ?? "tool-default";
}
