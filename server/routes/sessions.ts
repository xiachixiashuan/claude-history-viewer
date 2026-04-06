import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { join } from "path";
import { projectsDir, getProjectSessionsDir } from "../utils/paths";
import { parseSession, getSessionSummary, type SessionSummary } from "../services/session-parser";

const sessions = new Hono();

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
        // Support group filters: "Task" matches TaskCreate/TaskUpdate/etc, "Web" matches WebFetch/WebSearch
        if (toolFilter) {
          const tools = Object.keys(summary.toolCallCounts);
          const match = toolFilter === "Task"
            ? tools.some(t => t === "TaskCreate" || t === "TaskUpdate")
            : toolFilter === "Web"
            ? tools.some(t => t.startsWith("Web"))
            : tools.includes(toolFilter);
          if (!match) continue;
        }
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

sessions.get("/:id", async (c) => {
  const sessionId = c.req.param("id");

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
