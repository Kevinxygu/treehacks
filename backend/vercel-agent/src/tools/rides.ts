import { tool } from "ai";
import { z } from "zod";
import { Stagehand } from "@browserbasehq/stagehand";
import { getDb } from "../db.js";

/* ------------------------------------------------------------------ */
/*  Ride pricing via Browserbase/Stagehand CUA Agent + Context (Uber)  */
/*  Uses persistent context so Uber login is reused across sessions.   */
/* ------------------------------------------------------------------ */

async function createStagehandWithContext() {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;
    const contextId = process.env.UBER_CONTEXT_ID;
    const modelApiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || !projectId) {
        throw new Error("BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set.");
    }

    if (!contextId) {
        throw new Error("UBER_CONTEXT_ID is not set. Run 'npx tsx src/uber-login.ts' first to create a persistent Uber session.");
    }

    const stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey,
        projectId,
        model: {
            modelName: "anthropic/claude-sonnet-4-20250514",
            apiKey: modelApiKey,
        },
        browserbaseSessionCreateParams: {
            projectId,
            browserSettings: {
                context: { id: contextId, persist: true },
            },
        },
    });
    await stagehand.init();
    return stagehand;
}

const RIDE_LOOKUP_ID = "latest" as const;

/** Store latest ride lookup in DB for follow-up questions. */
async function saveRideLookup(pickup: string, destination: string, prices: string) {
    try {
        const db = await getDb();
        await db.collection("ride_lookups").replaceOne(
            { id: RIDE_LOOKUP_ID },
            { id: RIDE_LOOKUP_ID, pickup, destination, prices, createdAt: new Date() },
            { upsert: true }
        );
    } catch (e) {
        console.error("  [Ride] Failed to save ride lookup:", e);
    }
}

/* ------------------------------------------------------------------ */
/*  Tools                                                              */
/* ------------------------------------------------------------------ */

export const getRidePrices = tool({
    description:
        "Get real-time Uber ride prices between two locations. " +
        "Uses the user's actual Uber account (pre-authenticated). " +
        "Returns all available ride types with prices and ETAs. Does NOT book.",
    parameters: z.object({
        pickup: z.string().describe("Pickup address or location name"),
        destination: z.string().describe("Destination address or location name"),
    }),
    execute: async ({ pickup, destination }) => {
        let stagehand: Stagehand | null = null;
        try {
            stagehand = await createStagehandWithContext();
            const page = stagehand.context.pages()[0];

            // Navigate to Uber (already logged in via context)
            await page.goto("https://m.uber.com", {
                waitUntil: "domcontentloaded",
                timeoutMs: 30000,
            });
            await page.waitForTimeout(5000);

            // Use CUA agent to handle the entire price lookup
            const agent = stagehand.agent({
                mode: "cua",
                model: {
                    modelName: "anthropic/claude-sonnet-4-20250514",
                    apiKey: process.env.ANTHROPIC_API_KEY!,
                },
                systemPrompt: "You are helping find Uber ride prices. " + "Do NOT book any ride. Only look up prices and report them.",
            });

            let agentResult: any = null;
            try {
                agentResult = await agent.execute({
                    instruction: `
I'm on the Uber app (already logged in). Do the following:
1. Enter "${pickup}" as the pickup location, then press Enter on the keyboard to select the first suggestion.
2. Enter "${destination}" as the destination, then press Enter on the keyboard to select the first suggestion.
3. Click Search or See Prices.
4. Wait for ride options to load.
5. Report ALL available ride types with their prices and ETAs exactly as shown on the page.
Do NOT take screenshots. Do NOT book any ride. Just give the prices as you see them.
          `,
                    maxSteps: 25,
                });
            } catch (agentErr: any) {
                // The CUA agent has a known bug where it completes the task
                // successfully but throws a ModelMessage error on the final
                // "done" step. When this happens the page is still showing
                // ride prices, so we fall back to extract().
                const isModelMsgBug =
                    agentErr.message?.includes("ModelMessage") ||
                    agentErr.message?.includes("UIMessage");

                if (!isModelMsgBug) throw agentErr;

                console.log("  [Ride] CUA agent hit ModelMessage bug — falling back to extract()");

                const extracted = await stagehand.extract(
                    "Extract ALL Uber ride types visible on this page. " +
                    "For each ride include the name, price, ETA/wait time, capacity, and any description or badge text."
                );

                const fallbackResult = {
                    success: true,
                    pickup,
                    destination,
                    prices: extracted.extraction,
                };
                await saveRideLookup(pickup, destination, String(extracted.extraction ?? ""));
                return fallbackResult;
            }

            const result = {
                success: agentResult.success,
                pickup,
                destination,
                prices: agentResult.message,
                steps: agentResult.actions?.length ?? 0,
            };
            if (result.success && agentResult.message) {
                await saveRideLookup(pickup, destination, String(agentResult.message));
            }
            return result;
        } catch (err: any) {
            return {
                success: false,
                error: `Ride price lookup failed: ${err.message}`,
                suggestion: "Make sure UBER_CONTEXT_ID is set and the Uber session is still valid. " + "Re-run 'npx tsx src/uber-login.ts' if needed.",
            };
        } finally {
            if (stagehand) await stagehand.close().catch(() => {});
        }
    },
});

export const getLastRideLookup = tool({
    description:
        "Get the most recent Uber ride price lookup from this conversation. " +
        "Use this when the user asks a follow-up about the last ride search (e.g. 'what was the UberX price?', 'which was cheapest?', 'how much for Comfort?'). " +
        "Returns pickup, destination, and the stored prices if a lookup was done; otherwise null.",
    parameters: z.object({}),
    execute: async () => {
        try {
            const db = await getDb();
            const doc = await db.collection("ride_lookups").findOne({ id: RIDE_LOOKUP_ID });
            if (!doc) return { hasLookup: false, message: "No ride lookup has been done yet in this session." };
            return {
                hasLookup: true,
                pickup: doc.pickup,
                destination: doc.destination,
                prices: doc.prices,
                createdAt: doc.createdAt,
            };
        } catch (e: any) {
            return { hasLookup: false, error: e.message };
        }
    },
});

export const rideTools = {
    getRidePrices,
    getLastRideLookup,
};
