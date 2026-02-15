/**
 * Terminal chat client for testing the agent without a frontend.
 *
 * Usage: npm run chat
 */
import "dotenv/config";
import readline from "readline";
import { generateText, type CoreMessage } from "ai";
import { createModel, getSystemPrompt } from "./agent.js";
import { allTools } from "./tools/index.js";

const model = createModel();
const messages: CoreMessage[] = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    // Load user profile into the system prompt once at startup
    const systemPrompt = await getSystemPrompt();

    function prompt() {
        rl.question("\nYou: ", async (input) => {
            const trimmed = input.trim();
            if (!trimmed || trimmed === "exit" || trimmed === "quit") {
                console.log("Goodbye!");
                rl.close();
                process.exit(0);
            }

            messages.push({ role: "user", content: trimmed });

            try {
                const { text, steps } = await generateText({
                    model,
                    system: systemPrompt,
                    messages,
                    tools: allTools,
                    maxSteps: 10,
                });

                // Show tool calls for transparency
                for (const step of steps) {
                    if (step.toolCalls?.length) {
                        for (const tc of step.toolCalls) {
                            console.log(`\n  [Tool: ${tc.toolName}]`);
                        }
                    }
                }

                console.log(`\nAssistant: ${text}`);
                messages.push({ role: "assistant", content: text });
            } catch (err: any) {
                console.error(`\nError: ${err.message}`);
            }

            prompt();
        });
    }

    console.log("===========================================");
    console.log("  Elder Care Assistant — Terminal Chat");
    console.log("  Type 'exit' to quit");
    console.log("===========================================");

    prompt();
}

main().catch(console.error);
