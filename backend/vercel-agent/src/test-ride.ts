import "dotenv/config";
import { getRidePrices } from "./tools/rides.js";

console.log("Testing Browserbase ride search...");
console.log("BROWSERBASE_API_KEY:", process.env.BROWSERBASE_API_KEY ? "set" : "MISSING");
console.log("BROWSERBASE_PROJECT_ID:", process.env.BROWSERBASE_PROJECT_ID ? "set" : "MISSING");
console.log("ANTHROPIC_API_KEY:", process.env.ANTHROPIC_API_KEY ? "set" : "MISSING");

console.log("\nStarting Browserbase session...");

const result = await getRidePrices.execute(
    { pickup: "Stanford University", destination: "San Francisco Airport" },
    { toolCallId: "test", messages: [], abortSignal: undefined as any },
);

console.log("\nResult:", JSON.stringify(result, null, 2));
