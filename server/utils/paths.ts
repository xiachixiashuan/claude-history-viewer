import { homedir } from "os";
import { join } from "path";

export const CLAUDE_HOME = join(homedir(), ".claude");
export const projectsDir = join(CLAUDE_HOME, "projects");
export const historyPath = join(CLAUDE_HOME, "history.jsonl");

export function decodeProjectName(encoded: string): string {
  return encoded.replace(/-/g, "/");
}

export function encodeProjectName(path: string): string {
  return path.replace(/\//g, "-");
}

export function getProjectSessionsDir(encodedName: string): string {
  return join(projectsDir, encodedName);
}
