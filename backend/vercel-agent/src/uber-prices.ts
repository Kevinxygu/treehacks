import "dotenv/config";
import open from "open";
import { Browserbase } from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";

// Paste your context ID from uber-login.ts
const CONTEXT_ID = process.env.UBER_CONTEXT_ID ?? "fb9e2d48-d4c9-4fe6-bdf0-73f8449182e4";

const PICKUP = "Jen-Hsun Huang Engineering Center";
const DESTINATION = "Golden Gate Bridge";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY!,
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    model: {
        modelName: "anthropic/claude-sonnet-4-20250514",
        apiKey: process.env.ANTHROPIC_API_KEY!,
    },
    browserbaseSessionCreateParams: {
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        browserSettings: {
            context: { id: CONTEXT_ID, persist: true },
        },
    },
});
await stagehand.init();

// Open Live View
const sessionId = stagehand.browserbaseSessionID!;
const liveViewLinks = await bb.sessions.debug(sessionId);
const liveViewUrl = liveViewLinks.debuggerFullscreenUrl;
console.log(`\n🔍 Live View: ${liveViewUrl}\n`);
try {
    await open(liveViewUrl);
    console.log("Opened live view in your browser.\n");
} catch {
    console.log("Open the URL above in your browser to watch.\n");
}

const page = stagehand.context.pages()[0];
console.log("Navigating to Uber (already authenticated via context)...");
await page.goto("https://m.uber.com", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(5000);

// Use agent to find prices
const agent = stagehand.agent({
    mode: "cua",
    model: {
        modelName: "anthropic/claude-sonnet-4-20250514",
        apiKey: process.env.ANTHROPIC_API_KEY!,
    },
    systemPrompt: "You are helping an elderly user find Uber ride prices. " + "Do NOT book any ride. Only look up prices and extract them.",
});

console.log(`Finding prices: ${PICKUP} → ${DESTINATION}...\n`);

const result = await agent.execute({
    instruction: `
    I'm on the Uber app (already logged in). Do the following:
    1. Enter "${PICKUP}" as the pickup location and select the first suggestion
    2. Enter "${DESTINATION}" as the destination and select the first suggestion
    3. Click Search or See Prices
    4. Wait for ride options to load
    5. Extract ALL available ride types with their prices and ETAs
    DO NOT book any ride. Just find the prices.
  `,
    maxSteps: 25,
});

console.log("\n=== Uber Ride Prices ===");
console.log(`From: ${PICKUP}`);
console.log(`To: ${DESTINATION}`);
console.log("\nResult:", result.message);
console.log("Success:", result.success);

if (result.actions) {
    console.log("Steps taken:", result.actions.length);
}

await stagehand.close();
