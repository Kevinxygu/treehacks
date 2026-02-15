import express from "express";
import { start } from "workflow/api";
import { syncElderHealthData } from "../workflows/sync-whoop.js";

const app = express();
app.use(express.json());
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001,http://localhost:3002").split(",").map((o) => o.trim());
app.use((req, res, next) => {
  const origin = req.get("Origin");
  const allow = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

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
