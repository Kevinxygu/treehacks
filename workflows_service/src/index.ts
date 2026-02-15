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
  await start(syncElderHealthData, [elderId]);
  return res.json({ message: "Sync health workflow started", elderId });
});

export default app;
