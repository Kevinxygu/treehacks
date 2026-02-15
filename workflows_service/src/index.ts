import express from "express";
import { start } from "workflow/api";
import { syncElderHealthData } from "../workflows/sync-whoop.js";

const app = express();
app.use(express.json());

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
