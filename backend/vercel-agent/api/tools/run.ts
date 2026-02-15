/**
 * Serverless endpoint: run a single tool by name.
 * Used when the main server runs on Vercel and delegates tool execution to this function.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runTool } from "../../src/toolRunner.js";

export const config = { maxDuration: 120 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { tool: toolName, args } = req.body as { tool?: string; args?: unknown };
        if (!toolName || typeof toolName !== "string") {
            res.status(400).json({ error: "Missing or invalid 'tool' in body" });
            return;
        }
        const result = await runTool(toolName, args ?? {});
        res.status(200).json({ result });
    } catch (err) {
        console.error("Tool run error:", err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Tool execution failed",
        });
    }
}
