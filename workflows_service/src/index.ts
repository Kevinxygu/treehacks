import express from "express";
import { start } from "workflow/api";
import { syncElderHealthData } from "../workflows/sync-whoop.js";

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/api/sync-health", async (req, res) => {
  const { elderId } = req.body;
  if (!elderId || typeof elderId !== "string") {
    return res.status(400).json({ error: "elderId required" });
  }
  const run = await start(syncElderHealthData, [elderId]);
  const result = { message: "Sync health workflow started", elderId, run };
  console.log("[sync-health] started", result);
  return res.json(result);
});

export default app;
