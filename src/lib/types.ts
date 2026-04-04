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
  TaskUpdate: "var(--color-tool-task)",
  TaskCreate: "var(--color-tool-task)",
  ToolSearch: "var(--color-tool-default)",
};

export const TOOL_ICONS: Record<string, string> = {
  Bash: "⚡",
  Agent: "⬡",
  Read: "📖",
  Grep: "🔍",
  Edit: "✏️",
  Write: "📝",
  Skill: "⚙",
  TaskUpdate: "📋",
  TaskCreate: "📋",
  ToolSearch: "🔧",
  Glob: "📂",
};

export function getToolColor(name: string): string {
  return TOOL_COLORS[name] ?? "var(--color-tool-default)";
}

export function getToolIcon(name: string): string {
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
    TaskUpdate: "tool-task",
    TaskCreate: "tool-task",
  };
  return map[name] ?? "tool-default";
}
