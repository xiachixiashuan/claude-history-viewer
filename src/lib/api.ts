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
