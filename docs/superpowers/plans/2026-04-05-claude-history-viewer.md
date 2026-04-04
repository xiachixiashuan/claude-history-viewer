# Claude Code History Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a beautiful dark-themed conversation history viewer for Claude Code, focused on tool call visualization.

**Architecture:** Hono backend reads `~/.claude/history.jsonl` and session JSONL files, exposes REST API. React + Tailwind v4 frontend renders a two-panel layout: left sidebar with project-grouped session list, right panel with full message flow showing tool calls in color-coded glassmorphic cards.

**Tech Stack:** Bun, Hono, Vite, React, Tailwind CSS v4, JetBrains Mono, Lucide React

**IMPORTANT:** All Agent subagents MUST use `model: "opus"` — do NOT use sonnet.

---

## File Structure

```
server/
  index.ts                    — Hono app entry, mounts routes, starts server on port 3456
  utils/paths.ts              — Path constants and encoding helpers (CLAUDE_HOME, projectsDir, etc.)
  services/session-parser.ts  — Parse JSONL: extractContentBlocks, parseSession, getSessionSummary
  routes/projects.ts          — GET /api/projects — list projects with session counts
  routes/sessions.ts          — GET /api/sessions, GET /api/sessions/:id — list and detail

src/
  main.tsx                    — React entry point
  App.tsx                     — Root component: Sidebar + MainPanel layout
  index.css                   — Tailwind imports + CSS variables for dark theme + tool colors

  lib/
    types.ts                  — Shared TypeScript types (SessionSummary, ParsedMessage, ToolCall, etc.)
    api.ts                    — fetch wrappers for /api/* endpoints

  components/
    sidebar/
      Sidebar.tsx             — Full sidebar: logo, search, filters, session list
      SearchBox.tsx           — Search input
      FilterChips.tsx         — Tool type filter chips
      SessionList.tsx         — Project-grouped session list
      SessionItem.tsx         — Single session row (title, time, tool dots)

    message/
      MessageFlow.tsx         — Scrollable message list for a session
      MessageBlock.tsx        — Single turn: RoleBar + content
      RoleBar.tsx             — Role indicator, model badge, version badge, timestamp
      TextContent.tsx         — Render assistant/user text
      ToolCallCard.tsx        — Color-coded glassmorphic tool call card
      ToolResult.tsx          — Tool output display (scrollable, diff support)

index.html                    — Vite HTML entry
vite.config.ts                — Vite config with proxy to backend
tsconfig.json                 — TypeScript config
package.json                  — Dependencies and scripts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "claude-history-viewer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run dev:server & bun run dev:client",
    "dev:server": "bun --watch server/index.ts",
    "dev:client": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "hono": "^4.12.10",
    "lucide-react": "^1.7.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.2",
    "@types/bun": "^1.3.11",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.2.2",
    "vite": "^8.0.3"
  },
  "peerDependencies": {
    "typescript": "^6.0.2"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["bun-types"],
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@server/*": ["server/*"]
    }
  },
  "include": ["src", "server", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3456",
    },
  },
});
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude History Viewer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create src/index.css**

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap");

@theme {
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --color-background: #09090b;
  --color-foreground: #e5e5e5;
  --color-card: rgba(255, 255, 255, 0.03);
  --color-card-foreground: #ccc;
  --color-muted: #1a1a1e;
  --color-muted-foreground: #666;
  --color-border: rgba(255, 255, 255, 0.06);
  --color-accent: #22c55e;
  --color-accent-foreground: #09090b;

  --color-tool-bash: #22c55e;
  --color-tool-agent: #a78bfa;
  --color-tool-read: #60a5fa;
  --color-tool-grep: #fbbf24;
  --color-tool-edit: #f472b6;
  --color-tool-write: #38bdf8;
  --color-tool-skill: #fb923c;
  --color-tool-task: #94a3b8;
  --color-tool-default: #888;

  --color-role-user: #22c55e;
  --color-role-assistant: #60a5fa;
  --color-role-system: #fbbf24;

  --color-diff-add: #4ade80;
  --color-diff-del: #f87171;
  --color-error: #f87171;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #333; }
```

- [ ] **Step 6: Create src/main.tsx**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Create src/App.tsx (placeholder)**

```tsx
export function App() {
  return (
    <div className="flex h-screen bg-background text-foreground font-mono">
      <div className="w-80 border-r border-border">Sidebar</div>
      <div className="flex-1">Main</div>
    </div>
  );
}
```

- [ ] **Step 8: Install dependencies and verify build**

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bun install`
Expected: Dependencies installed successfully.

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bunx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git init
echo "node_modules\ndist\n.superpowers" > .gitignore
git add package.json tsconfig.json vite.config.ts index.html src/ .gitignore
git commit -m "feat: scaffold project with Vite + React + Tailwind + Hono setup"
```

---

### Task 2: Backend — Paths & Session Parser

**Files:**
- Create: `server/utils/paths.ts`
- Create: `server/services/session-parser.ts`

- [ ] **Step 1: Create server/utils/paths.ts**

```ts
import { homedir } from "os";
import { join } from "path";

export const CLAUDE_HOME = join(homedir(), ".claude");
export const projectsDir = join(CLAUDE_HOME, "projects");
export const historyPath = join(CLAUDE_HOME, "history.jsonl");

export function decodeProjectName(encoded: string): string {
  // "-Users-wendale-learn" → "/Users/wendale/learn"
  return encoded.replace(/-/g, "/");
}

export function encodeProjectName(path: string): string {
  return path.replace(/\//g, "-");
}

export function getProjectSessionsDir(encodedName: string): string {
  return join(projectsDir, encodedName);
}
```

- [ ] **Step 2: Create server/services/session-parser.ts**

This is the core parser. It reads JSONL files and produces structured messages with tool calls matched to their results.

```ts
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
    // Skip empty assistant messages (no text, no tools)
    if (type === "assistant" && !text.trim() && toolUses.length === 0) continue;

    const parsed: ParsedMessage = {
      type: type as ParsedMessage["type"],
      uuid: String(raw.uuid ?? ""),
      timestamp: String(raw.timestamp ?? ""),
      textContent: text,
    };

    // Extract metadata
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
      // Strip system-reminder tags from first message
      const cleaned = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
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
```

- [ ] **Step 3: Verify parser compiles**

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bun build server/services/session-parser.ts --outdir /tmp/test-build --target bun`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add server/
git commit -m "feat: add backend path utils and session JSONL parser"
```

---

### Task 3: Backend — API Routes

**Files:**
- Create: `server/index.ts`
- Create: `server/routes/projects.ts`
- Create: `server/routes/sessions.ts`

- [ ] **Step 1: Create server/routes/projects.ts**

```ts
import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { projectsDir, decodeProjectName, getProjectSessionsDir } from "../utils/paths";

export interface ProjectInfo {
  encodedName: string;
  path: string;
  name: string;
  sessionCount: number;
  lastActive: string;
}

const projects = new Hono();

projects.get("/", async (c) => {
  let entries: string[];
  try {
    entries = await readdir(projectsDir);
  } catch {
    return c.json([]);
  }

  const result: ProjectInfo[] = [];

  for (const entry of entries) {
    const fullPath = join(projectsDir, entry);
    const entryStat = await stat(fullPath).catch(() => null);
    if (!entryStat?.isDirectory()) continue;

    const decodedPath = decodeProjectName(entry);
    const name = basename(decodedPath);

    const files = await readdir(fullPath).catch(() => []);
    const sessionFiles = files.filter((f) => f.endsWith(".jsonl"));
    if (sessionFiles.length === 0) continue;

    // Get last active timestamp from most recently modified session file
    let lastActive = "";
    for (const sf of sessionFiles) {
      const sfStat = await stat(join(fullPath, sf)).catch(() => null);
      if (sfStat) {
        const mtime = sfStat.mtime.toISOString();
        if (mtime > lastActive) lastActive = mtime;
      }
    }

    result.push({
      encodedName: entry,
      path: decodedPath,
      name,
      sessionCount: sessionFiles.length,
      lastActive,
    });
  }

  result.sort((a, b) => b.lastActive.localeCompare(a.lastActive));
  return c.json(result);
});

export default projects;
```

- [ ] **Step 2: Create server/routes/sessions.ts**

```ts
import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { projectsDir, getProjectSessionsDir } from "../utils/paths";
import { parseSession, getSessionSummary, type SessionSummary } from "../services/session-parser";

const sessions = new Hono();

// GET / — list all sessions, optionally filtered by project, tool type, and search query
sessions.get("/", async (c) => {
  const projectFilter = c.req.query("project");
  const toolFilter = c.req.query("tool");
  const query = c.req.query("q")?.toLowerCase();

  let projectDirs: string[];
  try {
    const entries = await readdir(projectsDir);
    projectDirs = [];
    for (const e of entries) {
      const s = await stat(join(projectsDir, e)).catch(() => null);
      if (s?.isDirectory()) projectDirs.push(e);
    }
  } catch {
    return c.json([]);
  }

  if (projectFilter) {
    projectDirs = projectDirs.filter((d) => d === projectFilter);
  }

  const allSummaries: (SessionSummary & { project: string })[] = [];

  for (const dir of projectDirs) {
    const sessDir = getProjectSessionsDir(dir);
    let files: string[];
    try {
      const entries = await readdir(sessDir);
      files = entries.filter((f) => f.endsWith(".jsonl"));
    } catch {
      continue;
    }

    for (const f of files) {
      const filePath = join(sessDir, f);
      try {
        const summary = await getSessionSummary(filePath);
        if (summary.messageCount === 0) continue;

        // Tool filter: session must contain this tool type
        if (toolFilter && !summary.toolCallCounts[toolFilter]) continue;

        // Search filter: check firstUserMessage
        if (query && !summary.firstUserMessage.toLowerCase().includes(query)) continue;

        allSummaries.push({ ...summary, project: dir });
      } catch {
        continue;
      }
    }
  }

  allSummaries.sort((a, b) => b.endTimestamp.localeCompare(a.endTimestamp));
  return c.json(allSummaries);
});

// GET /:id — session detail with full messages
sessions.get("/:id", async (c) => {
  const sessionId = c.req.param("id");

  // Search all project dirs for the session file
  let filePath: string | null = null;
  try {
    const entries = await readdir(projectsDir);
    for (const dir of entries) {
      const candidate = join(projectsDir, dir, `${sessionId}.jsonl`);
      try {
        await Bun.file(candidate).text();
        filePath = candidate;
        break;
      } catch {}
    }
  } catch {}

  if (!filePath) {
    return c.json({ error: "Session not found" }, 404);
  }

  const [messages, summary] = await Promise.all([
    parseSession(filePath),
    getSessionSummary(filePath),
  ]);

  return c.json({ messages, summary });
});

export default sessions;
```

- [ ] **Step 3: Create server/index.ts**

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import projects from "./routes/projects";
import sessions from "./routes/sessions";

const app = new Hono();

app.use("*", cors());

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.route("/api/projects", projects);
app.route("/api/sessions", sessions);

export default {
  port: 3456,
  fetch: app.fetch,
};
```

- [ ] **Step 4: Test the server manually**

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bun server/index.ts &`
Then: `curl -s http://localhost:3456/api/health`
Expected: `{"status":"ok"}`

Then: `curl -s http://localhost:3456/api/projects | head -c 200`
Expected: JSON array with project entries.

Then: `curl -s http://localhost:3456/api/sessions | head -c 300`
Expected: JSON array with session summaries.

Kill the background server after testing.

- [ ] **Step 5: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add server/
git commit -m "feat: add Hono API routes for projects and sessions"
```

---

### Task 4: Frontend — Types & API Layer

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/lib/types.ts**

```ts
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

// Tool color/icon mapping
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
```

- [ ] **Step 2: Create src/lib/api.ts**

```ts
import type { ProjectInfo, SessionSummary, SessionDetail } from "./types";

const BASE = "/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getProjects(): Promise<ProjectInfo[]> {
  return fetchJson(`${BASE}/projects`);
}

export async function getSessions(params?: {
  project?: string;
  tool?: string;
  q?: string;
}): Promise<SessionSummary[]> {
  const sp = new URLSearchParams();
  if (params?.project) sp.set("project", params.project);
  if (params?.tool) sp.set("tool", params.tool);
  if (params?.q) sp.set("q", params.q);
  const qs = sp.toString();
  return fetchJson(`${BASE}/sessions${qs ? `?${qs}` : ""}`);
}

export async function getSessionDetail(id: string): Promise<SessionDetail> {
  return fetchJson(`${BASE}/sessions/${id}`);
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add src/lib/
git commit -m "feat: add frontend types and API client"
```

---

### Task 5: Frontend — Sidebar Components

**Files:**
- Create: `src/components/sidebar/SearchBox.tsx`
- Create: `src/components/sidebar/FilterChips.tsx`
- Create: `src/components/sidebar/SessionItem.tsx`
- Create: `src/components/sidebar/SessionList.tsx`
- Create: `src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Create src/components/sidebar/SearchBox.tsx**

```tsx
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="搜索对话、工具、关键词..."
      className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground text-xs font-mono placeholder:text-muted-foreground outline-none focus:border-accent/30 transition-colors"
    />
  );
}
```

- [ ] **Step 2: Create src/components/sidebar/FilterChips.tsx**

```tsx
const FILTERS = ["All", "Bash", "Agent", "Skill", "Edit", "Read", "Write", "Grep"];

interface FilterChipsProps {
  active: string;
  onChange: (filter: string) => void;
}

export function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap border transition-colors cursor-pointer ${
            active === f
              ? "border-accent/30 text-accent bg-accent/5"
              : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground/60"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create src/components/sidebar/SessionItem.tsx**

```tsx
import type { SessionSummary } from "@/lib/types";
import { getToolColor } from "@/lib/types";

interface SessionItemProps {
  session: SessionSummary;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(ts: string): string {
  if (!ts) return "";
  const d = new Date(ts);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${min}`;
}

export function SessionItem({ session, isActive, onClick }: SessionItemProps) {
  const toolCount = Object.values(session.toolCallCounts).reduce((a, b) => a + b, 0);
  const toolTypes = Object.keys(session.toolCallCounts);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 border-l-2 transition-all cursor-pointer ${
        isActive
          ? "bg-accent/4 border-l-accent"
          : "border-l-transparent hover:bg-white/2"
      }`}
    >
      <div className="text-xs text-card-foreground truncate mb-1">
        {session.firstUserMessage || "Empty session"}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
        <span>{formatTime(session.endTimestamp)}</span>
        <span>·</span>
        <span>{toolCount} tools</span>
        <div className="flex gap-1 ml-auto">
          {toolTypes.slice(0, 4).map((t) => (
            <div
              key={t}
              className="w-[5px] h-[5px] rounded-full"
              style={{ backgroundColor: getToolColor(t) }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Create src/components/sidebar/SessionList.tsx**

```tsx
import { SessionItem } from "./SessionItem";
import type { SessionSummary } from "@/lib/types";
import { decodeProjectName } from "@/lib/types";

interface SessionListProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelect }: SessionListProps) {
  // Group by project
  const groups = new Map<string, SessionSummary[]>();
  for (const s of sessions) {
    const key = s.project;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {Array.from(groups.entries()).map(([project, items]) => {
        // Extract short project name from encoded path
        const parts = project.replace(/^-/, "").split("-");
        const shortName = parts[parts.length - 1] || project;

        return (
          <div key={project} className="mb-1">
            <div className="sticky top-0 bg-background z-10 px-4 py-1.5 text-[10px] text-muted-foreground font-mono font-medium tracking-wider uppercase">
              {shortName}
            </div>
            {items.map((s) => (
              <SessionItem
                key={s.sessionId}
                session={s}
                isActive={s.sessionId === activeSessionId}
                onClick={() => onSelect(s.sessionId)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

Note: We need to add `decodeProjectName` to `src/lib/types.ts` — but actually SessionList doesn't use it, it extracts the short name inline. No change needed.

- [ ] **Step 5: Create src/components/sidebar/Sidebar.tsx**

```tsx
import { SearchBox } from "./SearchBox";
import { FilterChips } from "./FilterChips";
import { SessionList } from "./SessionList";
import type { SessionSummary } from "@/lib/types";

interface SidebarProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  toolFilter: string;
  onToolFilterChange: (f: string) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  searchQuery,
  onSearchChange,
  toolFilter,
  onToolFilterChange,
}: SidebarProps) {
  return (
    <div className="w-80 border-r border-border flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-sm font-semibold text-accent tracking-wide">
            claude-history
          </span>
        </div>
        <SearchBox value={searchQuery} onChange={onSearchChange} />
      </div>
      <FilterChips active={toolFilter} onChange={onToolFilterChange} />
      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={onSelectSession}
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add src/components/sidebar/
git commit -m "feat: add sidebar components — search, filters, session list"
```

---

### Task 6: Frontend — Message Flow Components

**Files:**
- Create: `src/components/message/RoleBar.tsx`
- Create: `src/components/message/TextContent.tsx`
- Create: `src/components/message/ToolResult.tsx`
- Create: `src/components/message/ToolCallCard.tsx`
- Create: `src/components/message/MessageBlock.tsx`
- Create: `src/components/message/MessageFlow.tsx`

- [ ] **Step 1: Create src/components/message/RoleBar.tsx**

```tsx
interface RoleBarProps {
  role: "user" | "assistant" | "system";
  model?: string;
  version?: string;
  timestamp: string;
}

const ROLE_LABELS: Record<string, string> = {
  user: "USER",
  assistant: "ASSISTANT",
  system: "SYSTEM",
};

export function RoleBar({ role, model, version, timestamp }: RoleBarProps) {
  const dotColor = {
    user: "bg-role-user shadow-[0_0_6px_rgba(34,197,94,0.3)]",
    assistant: "bg-role-assistant shadow-[0_0_6px_rgba(96,165,250,0.3)]",
    system: "bg-role-system shadow-[0_0_6px_rgba(251,191,36,0.3)]",
  }[role];

  const nameColor = {
    user: "text-role-user",
    assistant: "text-role-assistant",
    system: "text-role-system",
  }[role];

  const time = timestamp ? formatTimestamp(timestamp) : "";

  return (
    <div className="flex items-center gap-2 mb-2 px-0.5 font-mono">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className={`text-[11px] font-semibold ${nameColor}`}>
        {ROLE_LABELS[role]}
      </span>
      {model && (
        <span className="text-[9px] px-1.5 py-px rounded-md border border-role-assistant/20 text-role-assistant">
          {model}
        </span>
      )}
      {version && (
        <span className="text-[9px] px-1.5 py-px rounded-md border border-border text-muted-foreground">
          {version}
        </span>
      )}
      <span className="ml-auto text-[10px] text-muted-foreground/50">{time}</span>
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}
```

- [ ] **Step 2: Create src/components/message/TextContent.tsx**

```tsx
interface TextContentProps {
  text: string;
  role: "user" | "assistant" | "system";
}

export function TextContent({ text, role }: TextContentProps) {
  if (!text.trim()) return null;

  // Strip system-reminder tags for cleaner display
  const cleaned = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
  if (!cleaned) return null;

  const baseClass = "text-xs leading-relaxed whitespace-pre-wrap py-2 px-3";
  const roleClass = role === "user"
    ? "text-card-foreground bg-accent/3 rounded font-mono"
    : "text-muted-foreground";

  return <div className={`${baseClass} ${roleClass}`}>{cleaned}</div>;
}
```

- [ ] **Step 3: Create src/components/message/ToolResult.tsx**

```tsx
interface ToolResultProps {
  result: string;
  isError?: boolean;
  toolName: string;
}

export function ToolResult({ result, isError, toolName }: ToolResultProps) {
  if (!result) return null;

  const isEdit = toolName === "Edit";

  return (
    <div
      className={`mt-2 p-2 rounded bg-black/30 text-[10px] leading-relaxed font-mono max-h-[120px] overflow-y-auto ${
        isError ? "border-l-2 border-l-error/30" : ""
      }`}
    >
      {isEdit ? <DiffView text={result} /> : <span className="text-muted-foreground/70">{result}</span>}
    </div>
  );
}

function DiffView({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("+") || line.startsWith("> ")) {
          return <div key={i} className="text-diff-add">{line}</div>;
        }
        if (line.startsWith("-") || line.startsWith("< ")) {
          return <div key={i} className="text-diff-del">{line}</div>;
        }
        return <div key={i} className="text-muted-foreground/70">{line}</div>;
      })}
    </>
  );
}
```

- [ ] **Step 4: Create src/components/message/ToolCallCard.tsx**

```tsx
import { getToolIcon, getToolCssClass } from "@/lib/types";
import { ToolResult } from "./ToolResult";
import type { ToolCall } from "@/lib/types";

interface ToolCallCardProps {
  tool: ToolCall;
}

function summarizeInput(tool: ToolCall): string {
  const { name, input } = tool;
  switch (name) {
    case "Bash":
      return String(input.command ?? "");
    case "Read":
      return `${input.file_path ?? ""}${input.offset ? ` :${input.offset}` : ""}${input.limit ? `-${Number(input.offset ?? 0) + Number(input.limit)}` : ""}`;
    case "Write":
      return `${input.file_path ?? ""} · new file`;
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
    case "ToolSearch":
      return String(input.query ?? "");
    default:
      return Object.values(input).map((v) => String(v)).join(", ").slice(0, 80);
  }
}

function getStatusLabel(tool: ToolCall): { text: string; className: string } {
  if (tool.isError) return { text: "✗ error", className: "text-error" };
  if (tool.name === "Bash" && tool.result !== undefined) {
    // Check for exit code in result
    return { text: "✓", className: "text-diff-add" };
  }
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

// CSS classes for tool card backgrounds/borders are defined in index.css
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

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const icon = getToolIcon(tool.name);
  const status = getStatusLabel(tool);
  const cardStyle = TOOL_CARD_STYLES[tool.name] ?? "bg-white/2 border-white/8";
  const isError = tool.isError;

  // Agent: show model tag
  const agentModel = tool.name === "Agent" ? String(tool.input.model ?? "") : "";

  return (
    <div
      className={`rounded-md border p-3 my-1.5 backdrop-blur-sm ${
        isError ? "bg-error/4 border-error/20" : cardStyle
      }`}
    >
      <div className="flex items-center gap-2 font-mono">
        <span className="text-xs">{icon}</span>
        <span className={`text-xs font-semibold`} style={{ color: `var(--color-${getToolCssClass(tool.name).replace("tool-", "tool-")})` }}>
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
        <span className="ml-auto text-[10px] text-muted-foreground/40 font-mono">
          {/* Duration placeholder — we don't have duration in data yet */}
        </span>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
        {summarizeInput(tool)}
      </div>
      <ToolResult result={tool.result ?? ""} isError={tool.isError} toolName={tool.name} />
    </div>
  );
}
```

- [ ] **Step 5: Create src/components/message/MessageBlock.tsx**

```tsx
import { RoleBar } from "./RoleBar";
import { TextContent } from "./TextContent";
import { ToolCallCard } from "./ToolCallCard";
import type { ParsedMessage } from "@/lib/types";

interface MessageBlockProps {
  message: ParsedMessage;
}

export function MessageBlock({ message }: MessageBlockProps) {
  return (
    <div className="mb-4">
      <RoleBar
        role={message.type}
        model={message.model}
        version={message.version}
        timestamp={message.timestamp}
      />
      <div className="pl-3.5 border-l border-white/4">
        <TextContent text={message.textContent} role={message.type} />
        {message.toolCalls?.map((tc) => (
          <ToolCallCard key={tc.id} tool={tc} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create src/components/message/MessageFlow.tsx**

```tsx
import { MessageBlock } from "./MessageBlock";
import type { ParsedMessage, SessionSummary } from "@/lib/types";

interface MessageFlowProps {
  messages: ParsedMessage[];
  summary: SessionSummary | null;
}

export function MessageFlow({ messages, summary }: MessageFlowProps) {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        选择一个对话查看详情
      </div>
    );
  }

  const toolCount = Object.values(summary.toolCallCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Session header */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <h2 className="font-mono text-sm font-medium text-foreground truncate">
          {summary.firstUserMessage || "Session"}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/20 text-accent font-mono shrink-0">
          {summary.cwd?.split("/").pop() ?? summary.project}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono shrink-0">
          {toolCount} tool calls · {summary.messageCount} messages · {summary.sessionId.slice(0, 8)}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg) => (
          <MessageBlock key={msg.uuid || msg.timestamp} message={msg} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add src/components/message/
git commit -m "feat: add message flow components — RoleBar, ToolCallCard, MessageBlock"
```

---

### Task 7: Frontend — Wire It All Together in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css` (add tool color utilities)

- [ ] **Step 1: Add tool color utility classes to src/index.css**

Append to the end of the existing `src/index.css`:

```css
/* Tool color utilities — used by ToolCallCard for dynamic coloring */
.text-tool-bash { color: var(--color-tool-bash); }
.text-tool-agent { color: var(--color-tool-agent); }
.text-tool-read { color: var(--color-tool-read); }
.text-tool-grep { color: var(--color-tool-grep); }
.text-tool-edit { color: var(--color-tool-edit); }
.text-tool-write { color: var(--color-tool-write); }
.text-tool-skill { color: var(--color-tool-skill); }
.text-tool-task { color: var(--color-tool-task); }
.text-tool-default { color: var(--color-tool-default); }

.bg-tool-bash\/5 { background-color: color-mix(in srgb, var(--color-tool-bash) 5%, transparent); }
.bg-tool-agent\/5 { background-color: color-mix(in srgb, var(--color-tool-agent) 5%, transparent); }
.bg-tool-read\/5 { background-color: color-mix(in srgb, var(--color-tool-read) 5%, transparent); }
.bg-tool-grep\/5 { background-color: color-mix(in srgb, var(--color-tool-grep) 5%, transparent); }
.bg-tool-edit\/5 { background-color: color-mix(in srgb, var(--color-tool-edit) 5%, transparent); }
.bg-tool-write\/5 { background-color: color-mix(in srgb, var(--color-tool-write) 5%, transparent); }
.bg-tool-skill\/5 { background-color: color-mix(in srgb, var(--color-tool-skill) 5%, transparent); }
.bg-tool-task\/3 { background-color: color-mix(in srgb, var(--color-tool-task) 3%, transparent); }
.bg-error\/4 { background-color: color-mix(in srgb, var(--color-error) 4%, transparent); }

.border-tool-bash\/15 { border-color: color-mix(in srgb, var(--color-tool-bash) 15%, transparent); }
.border-tool-agent\/20 { border-color: color-mix(in srgb, var(--color-tool-agent) 20%, transparent); }
.border-tool-read\/15 { border-color: color-mix(in srgb, var(--color-tool-read) 15%, transparent); }
.border-tool-grep\/15 { border-color: color-mix(in srgb, var(--color-tool-grep) 15%, transparent); }
.border-tool-edit\/15 { border-color: color-mix(in srgb, var(--color-tool-edit) 15%, transparent); }
.border-tool-write\/15 { border-color: color-mix(in srgb, var(--color-tool-write) 15%, transparent); }
.border-tool-skill\/15 { border-color: color-mix(in srgb, var(--color-tool-skill) 15%, transparent); }
.border-tool-task\/12 { border-color: color-mix(in srgb, var(--color-tool-task) 12%, transparent); }
.border-tool-agent\/30 { border-color: color-mix(in srgb, var(--color-tool-agent) 30%, transparent); }
.border-error\/20 { border-color: color-mix(in srgb, var(--color-error) 20%, transparent); }
```

- [ ] **Step 2: Rewrite src/App.tsx with full integration**

```tsx
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { MessageFlow } from "./components/message/MessageFlow";
import { getSessions, getSessionDetail } from "./lib/api";
import type { SessionSummary, ParsedMessage } from "./lib/types";

export function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [activeSummary, setActiveSummary] = useState<SessionSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toolFilter, setToolFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const params: { q?: string; tool?: string } = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (toolFilter !== "All") params.tool = toolFilter;
      const data = await getSessions(params);
      setSessions(data);

      // Auto-select first session if none active
      if (!activeSessionId && data.length > 0) {
        setActiveSessionId(data[0].sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toolFilter]);

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
```

- [ ] **Step 3: Build and verify**

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bunx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Start server and test in browser**

Run: `cd /Users/wendale/learn/claude-toolbox-v4 && bun run dev:server &`
Then: `cd /Users/wendale/learn/claude-toolbox-v4 && bunx vite --port 5173 &`

Open http://localhost:5173 in browser. Expected:
- Left sidebar shows project-grouped session list
- Clicking a session loads messages in right panel
- Tool call cards display with correct colors and icons
- Search and filter chips work

- [ ] **Step 5: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add src/App.tsx src/index.css
git commit -m "feat: wire up App with sidebar, message flow, and API integration"
```

---

### Task 8: Polish — ToolCallCard Color Fix & Final Adjustments

This task fixes the dynamic tool color approach in ToolCallCard (using inline styles instead of CSS variable interpolation which Tailwind can't process) and any visual issues found during Task 7 testing.

**Files:**
- Modify: `src/components/message/ToolCallCard.tsx`
- Modify: `src/index.css` (may need adjustments)

- [ ] **Step 1: Fix ToolCallCard tool name coloring**

The `style={{ color: \`var(--color-...)\` }}` approach in ToolCallCard works but is fragile. Replace with a simpler mapping:

In `ToolCallCard.tsx`, replace the tool name `<span>` with:

```tsx
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

// In the JSX:
<span className={`text-xs font-semibold ${TOOL_NAME_CLASSES[tool.name] ?? "text-tool-default"}`}>
  {tool.name}
</span>
```

- [ ] **Step 2: Test and fix any visual issues**

Run the dev servers, check the browser:
- All tool cards have correct background/border colors
- Tool name text is the right color
- Edit diffs show red/green correctly
- Bash errors show red border
- Agent cards show model badge
- Skill cards show skill name in detail

Fix any issues found.

- [ ] **Step 3: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add -A
git commit -m "fix: polish tool card colors and visual adjustments"
```

---

### Task 9: Debounced Search

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add debounced search to App.tsx**

The search currently fires on every keystroke. Add a debounce:

```tsx
// Add to App.tsx, before the component:
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// In the component, replace direct searchQuery usage in fetchSessions:
const debouncedQuery = useDebounce(searchQuery, 300);

// Update the useCallback dependencies to use debouncedQuery:
const fetchSessions = useCallback(async () => {
  // ... use debouncedQuery instead of searchQuery
}, [debouncedQuery, toolFilter]);

useEffect(() => {
  fetchSessions();
}, [fetchSessions]);
```

- [ ] **Step 2: Verify search works with debounce**

Type in the search box. Expected: API call fires 300ms after last keystroke, not on every key.

- [ ] **Step 3: Commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add src/App.tsx
git commit -m "feat: add debounced search for session filtering"
```

---

### Task 10: Final Integration Test & Cleanup

**Files:**
- Possibly modify any file that needs fixes

- [ ] **Step 1: Full end-to-end test**

Start both servers:
```bash
cd /Users/wendale/learn/claude-toolbox-v4
bun run dev
```

Open http://localhost:5173. Verify:
1. Session list loads with projects grouped
2. Clicking sessions loads messages
3. Tool calls display correctly for: Bash, Read, Grep, Edit (diff), Write, Agent (model badge), Skill, TaskUpdate
4. Search filters sessions
5. Tool filter chips filter sessions
6. Error tool calls show red styling
7. Scrolling works in both panels

- [ ] **Step 2: Fix any issues found**

Address bugs discovered during testing.

- [ ] **Step 3: Final commit**

```bash
cd /Users/wendale/learn/claude-toolbox-v4
git add -A
git commit -m "feat: Claude Code history viewer — complete implementation"
```
