import { createReadStream } from "fs";
import { createInterface } from "readline";

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
  messageCount: number;
  firstUserMessage: string;
  startTimestamp: string;
  endTimestamp: string;
  toolCallCounts: Record<string, number>;
  model?: string;
  version?: string;
  cwd?: string;
}

const SKIP_TYPES = new Set([
  "permission-mode",
  "file-history-snapshot",
  "queue-operation",
  "last-prompt",
]);

async function readAllLines(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });
    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    });
    rl.on("close", () => resolve(lines));
    rl.on("error", reject);
  });
}

interface ContentBlocks {
  text: string;
  toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  toolResults: Array<{ toolUseId: string; content: string; isError: boolean }>;
}

function extractContentBlocks(content: unknown): ContentBlocks {
  const toolUses: ContentBlocks["toolUses"] = [];
  const toolResults: ContentBlocks["toolResults"] = [];
  const textParts: string[] = [];

  if (typeof content === "string") {
    return { text: content, toolUses, toolResults };
  }

  if (Array.isArray(content)) {
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const b = block as Record<string, unknown>;
      if (b.type === "text") {
        textParts.push(String(b.text ?? ""));
      } else if (b.type === "tool_use") {
        toolUses.push({
          id: String(b.id ?? ""),
          name: String(b.name ?? ""),
          input: (b.input as Record<string, unknown>) ?? {},
        });
      } else if (b.type === "tool_result") {
        const rc = b.content;
        let resultText = "";
        if (typeof rc === "string") {
          resultText = rc;
        } else if (Array.isArray(rc)) {
          resultText = rc
            .filter((c: unknown) => c && typeof c === "object" && (c as Record<string, unknown>).type === "text")
            .map((c: unknown) => String((c as Record<string, unknown>).text ?? ""))
            .join("\n");
        }
        toolResults.push({
          toolUseId: String(b.tool_use_id ?? ""),
          content: resultText,
          isError: Boolean(b.is_error),
        });
      }
    }
  }

  return { text: textParts.join("\n"), toolUses, toolResults };
}

function isPureToolResult(content: unknown): boolean {
  if (!Array.isArray(content) || content.length === 0) return false;
  return content.every(
    (b: unknown) => b && typeof b === "object" && (b as Record<string, unknown>).type === "tool_result"
  );
}

export async function parseSession(filePath: string): Promise<ParsedMessage[]> {
  const lines = await readAllLines(filePath);

  // First pass: collect all tool results
  const toolResultMap = new Map<string, { content: string; isError: boolean }>();
  for (const line of lines) {
    let raw: Record<string, unknown>;
    try { raw = JSON.parse(line); } catch { continue; }
    const message = raw.message as Record<string, unknown> | undefined;
    if (!message) continue;
    const { toolResults } = extractContentBlocks(message.content);
    for (const tr of toolResults) {
      toolResultMap.set(tr.toolUseId, { content: tr.content, isError: tr.isError });
    }
  }

  // Second pass: build messages, skip pure tool_result messages
  const messages: ParsedMessage[] = [];
  for (const line of lines) {
    let raw: Record<string, unknown>;
    try { raw = JSON.parse(line); } catch { continue; }

    const type = raw.type as string;
    if (SKIP_TYPES.has(type)) continue;
    if (type !== "user" && type !== "assistant" && type !== "system") continue;

    const message = raw.message as Record<string, unknown> | undefined;
    if (!message) continue;
    if (isPureToolResult(message.content)) continue;

    const { text, toolUses } = extractContentBlocks(message.content);
    if (type === "assistant" && !text.trim() && toolUses.length === 0) continue;

    const parsed: ParsedMessage = {
      type: type as ParsedMessage["type"],
      uuid: String(raw.uuid ?? ""),
      timestamp: String(raw.timestamp ?? ""),
      textContent: text,
    };

    const model = message.model as string | undefined;
    if (model) parsed.model = model;
    const version = raw.version as string | undefined;
    if (version) parsed.version = version;
    const cwd = raw.cwd as string | undefined;
    if (cwd) parsed.cwd = cwd;
    const gitBranch = raw.gitBranch as string | undefined;
    if (gitBranch) parsed.gitBranch = gitBranch;

    if (toolUses.length > 0) {
      parsed.toolCalls = toolUses.map((tu) => {
        const tc: ToolCall = { id: tu.id, name: tu.name, input: tu.input };
        const result = toolResultMap.get(tu.id);
        if (result) {
          tc.result = result.content;
          tc.isError = result.isError;
        }
        return tc;
      });
    }

    messages.push(parsed);
  }

  return messages;
}

export async function getSessionSummary(filePath: string): Promise<SessionSummary> {
  const sessionId = filePath.split("/").pop()?.replace(".jsonl", "") ?? "";
  const lines = await readAllLines(filePath);

  let messageCount = 0;
  let firstUserMessage = "";
  let startTimestamp = "";
  let endTimestamp = "";
  const toolCallCounts: Record<string, number> = {};
  let model: string | undefined;
  let version: string | undefined;
  let cwd: string | undefined;

  for (const line of lines) {
    let raw: Record<string, unknown>;
    try { raw = JSON.parse(line); } catch { continue; }

    const type = raw.type as string;
    if (SKIP_TYPES.has(type)) continue;
    if (type !== "user" && type !== "assistant" && type !== "system") continue;

    const message = raw.message as Record<string, unknown> | undefined;
    if (!message) continue;
    if (isPureToolResult(message.content)) continue;

    const { text, toolUses } = extractContentBlocks(message.content);
    if (type === "assistant" && !text.trim() && toolUses.length === 0) continue;

    messageCount++;
    const ts = String(raw.timestamp ?? "");
    if (!startTimestamp || ts < startTimestamp) startTimestamp = ts;
    if (!endTimestamp || ts > endTimestamp) endTimestamp = ts;

    if (type === "user" && !firstUserMessage && text.trim()) {
      const cleaned = text
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
        .replace(/<command-[^>]*>[\s\S]*?<\/command-[^>]*>/g, "")
        .replace(/<local-command-[^>]*>[\s\S]*?<\/local-command-[^>]*>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (cleaned) firstUserMessage = cleaned.slice(0, 80);
    }

    if (type === "assistant") {
      const m = message.model as string | undefined;
      if (m && !model) model = m;
    }
    if (!version && raw.version) version = String(raw.version);
    if (!cwd && raw.cwd) cwd = String(raw.cwd);

    for (const tu of toolUses) {
      toolCallCounts[tu.name] = (toolCallCounts[tu.name] ?? 0) + 1;
    }
  }

  return {
    sessionId,
    messageCount,
    firstUserMessage,
    startTimestamp,
    endTimestamp,
    toolCallCounts,
    model,
    version,
    cwd,
  };
}
