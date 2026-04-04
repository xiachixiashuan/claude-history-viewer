import { Hono } from "hono";
import { readdir, stat } from "fs/promises";
import { join, basename } from "path";
import { projectsDir, decodeProjectName } from "../utils/paths";

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
