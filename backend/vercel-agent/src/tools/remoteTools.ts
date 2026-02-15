/**
 * When TOOLS_SERVERLESS_URL is set, the main server uses these proxy tools:
 * same schema and description, but execute() calls the serverless endpoint.
 * That way the (heavy) tool logic runs on Vercel serverless while the
 * main Express app can run on Vercel too or elsewhere.
 */
import type { AllTools } from "./index.js";

const TOOLS_RUN_PATH = "/api/tools/run";

function makeRemoteTools(baseUrl: string, toolMap: AllTools): AllTools {
    const url = baseUrl.replace(/\/$/, "") + TOOLS_RUN_PATH;
    const result: Record<string, { description: string; parameters: unknown; execute: (args: unknown) => Promise<unknown> }> = {};
    for (const [name, tool] of Object.entries(toolMap)) {
        const t = tool as { description: string; parameters: unknown; execute: (args: unknown) => Promise<unknown> };
        result[name] = {
            description: t.description,
            parameters: t.parameters,
            async execute(args: unknown) {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tool: name, args }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Tool ${name} failed: ${res.status} - ${text}`);
                }
                const data = await res.json();
                return data.result;
            },
        };
    }
    return result as AllTools;
}

export function getRemoteTools(baseUrl: string, toolMap: AllTools): AllTools {
    return makeRemoteTools(baseUrl, toolMap);
}
