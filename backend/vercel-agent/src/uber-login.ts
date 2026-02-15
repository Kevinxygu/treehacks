import "dotenv/config";
import open from "open";
import { Browserbase } from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";

const UBER_EMAIL = "vs301vs@gmail.com";
const UBER_PASSWORD = "3uBiNu94t3xLv2v";

// Step 1: Create a persistent context
const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });
const context = await bb.contexts.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
});
console.log("Created Context ID:", context.id);
console.log(">>> SAVE THIS ID <<<\n");

// Step 2: Start session with the context (persist: true)
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
            context: { id: context.id, persist: true },
        },
    },
});
await stagehand.init();

// Step 2b: Open Live View so you can watch the agent
const sessionId = stagehand.browserbaseSessionID!;
const liveViewLinks = await bb.sessions.debug(sessionId);
const liveViewUrl = liveViewLinks.debuggerFullscreenUrl;
console.log(`\n🔍 Live View: ${liveViewUrl}\n`);

// Auto-open in your browser
try {
    await open(liveViewUrl);
    console.log("Opened live view in your browser. Watch the agent work!\n");
} catch {
    console.log("Copy the URL above and open it in your browser to watch.\n");
}

const page = stagehand.context.pages()[0];
await page.goto("https://m.uber.com", { waitUntil: "domcontentloaded", timeoutMs: 30000 });
await page.waitForTimeout(5000);

// Step 3: Use agent to log in
const agent = stagehand.agent({
    mode: "cua",
    model: {
        modelName: "anthropic/claude-sonnet-4-20250514",
        apiKey: process.env.ANTHROPIC_API_KEY!,
    },
    systemPrompt: "You are logging into Uber for an elderly user. " + "Complete the login flow. If asked for OTP, click 'More Options' and choose Password instead.",
});

console.log("Agent logging into Uber...");

const result = await agent.execute({
    instruction: `
    Log into Uber with these credentials:
    - Email: ${UBER_EMAIL}
    - Password: ${UBER_PASSWORD}
    
    Steps:
    1. Click sign in / log in
    2. Enter the email and click Next
    3. If it asks for OTP, click "More Options" and select "Password"
    4. Enter the password and click Next / Log in
    5. Wait until you see the Uber home screen with "Where to?"
  `,
    maxSteps: 20,
});

console.log("\nAgent result:", result.message);
console.log("Success:", result.success);

await stagehand.close();

// Wait for context to sync
console.log("\nWaiting for context to sync...");
await new Promise((r) => setTimeout(r, 5000));

console.log("\n=== DONE ===");
console.log("Context ID:", context.id);
console.log("Add this to your .env: UBER_CONTEXT_ID=" + context.id);
