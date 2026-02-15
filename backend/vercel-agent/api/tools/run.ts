/**
 * Serverless endpoint: run a single tool by name.
 * POST body: { tool: string, args: object }
 * Used when the main server runs elsewhere and delegates tool execution to Vercel.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runTool } from "../../src/toolRunner.js";

export const config = {
    maxDuration: 120,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body as { tool?: string; args?: unknown };
    const toolName = body?.tool;
    const args = body?.args ?? {};

    if (!toolName || typeof toolName !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'tool' in body" });
    }

    try {
        const result = await runTool(toolName, args);
        return res.status(200).json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[tools/run] ${toolName}:`, message);
        return res.status(500).json({ error: message });
    }
}
