/**
 * Run a single tool by name with the given args.
 * Used by the serverless tool endpoint so tool execution can run on Vercel
 * while the main Express server runs normally elsewhere.
 */
import { allTools } from "./tools/index.js";

export type ToolName = keyof typeof allTools;

const toolMap = allTools as Record<string, { execute: (args: unknown) => Promise<unknown> }>;

export async function runTool(toolName: string, args: unknown): Promise<unknown> {
    const tool = toolMap[toolName];
    if (!tool?.execute) {
        throw new Error(`Unknown tool: ${toolName}. Valid: ${Object.keys(toolMap).join(", ")}`);
    }
    return tool.execute(args);
}

export function getToolNames(): string[] {
    return Object.keys(toolMap);
}
