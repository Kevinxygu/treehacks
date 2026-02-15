/**
 * Run a single tool by name. Used by the serverless endpoint api/tools/run.ts
 * so tool execution can run on Vercel while the main app can run elsewhere or also on Vercel.
 */
import { allTools } from "./tools/index.js";

export async function runTool(toolName: string, args: unknown): Promise<unknown> {
    const tool = (allTools as unknown as Record<string, { execute: (args: unknown) => Promise<unknown> }>)[toolName];
    if (!tool?.execute) {
        throw new Error(`Unknown tool: ${toolName}. Valid: ${Object.keys(allTools).join(", ")}`);
    }
    return tool.execute(args);
}
