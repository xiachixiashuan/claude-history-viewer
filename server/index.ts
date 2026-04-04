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
