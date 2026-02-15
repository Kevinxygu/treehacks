import { tool } from "ai";
import type { z } from "zod";
import { allTools } from "./index.js";

const TOOLS_RUN_PATH = "/api/tools/run";

/**
 * When TOOLS_SERVERLESS_URL is set, the main server uses these proxy tools:
 * same schema and description, but execute() calls the serverless endpoint.
 * That way the (heavy) tool logic runs on Vercel serverless while the
 * Express server runs normally elsewhere.
 */
export function getRemoteTools(baseUrl: string): typeof allTools {
    const url = baseUrl.replace(/\/$/, "") + TOOLS_RUN_PATH;
    const toolEntries = Object.entries(allTools) as [string, (typeof allTools)[keyof typeof allTools]][];
    const remote = {} as typeof allTools;

    for (const [name, t] of toolEntries) {
        const desc = t.description;
        const params = t.parameters as z.ZodTypeAny;
        remote[name as keyof typeof allTools] = tool({
            description: desc,
            parameters: params,
            execute: async (args) => {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tool: name, args }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error((err as { error?: string }).error ?? `Tool ${name} failed: ${res.status}`);
                }
                return res.json();
            },
        }) as (typeof allTools)[keyof typeof allTools];
    }

    return remote;
}
