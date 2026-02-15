import express from "express";
import { start } from "workflow/api";
import { syncElderHealthData } from "../workflows/sync-whoop.js";

const app = express();
app.use(express.json());
const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);
const allowOrigin = (origin: string | undefined) =>
  origin && corsOrigins.length && corsOrigins.includes(origin) ? origin : "*";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowOrigin(req.get("Origin")));
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.options("/api/sync-health", (_, res) => res.sendStatus(204));
app.post("/api/sync-health", async (req, res) => {
  const { elderId } = req.body;
  if (!elderId || typeof elderId !== "string") {
    return res.status(400).json({ error: "elderId required" });
  }
  const run = await start(syncElderHealthData, [elderId]);
  const result = await run.returnValue;
  console.log("[sync-health] completed", result);
  return res.json(result);
});

export default app;
