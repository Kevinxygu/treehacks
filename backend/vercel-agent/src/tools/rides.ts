import { tool, generateObject } from "ai";
import { z } from "zod";
import { Browserbase } from "@browserbasehq/sdk";
import { Stagehand } from "@browserbasehq/stagehand";
import { getDb } from "../db.js";
import { createModel } from "../agent.js";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY ?? "" });

/* ------------------------------------------------------------------ */
/*  Structured extraction of ride options from raw text (AI SDK)       */
/* ------------------------------------------------------------------ */

const rideOptionSchema = z.object({
    rideOptions: z.array(
        z.object({
            name: z.string().describe("Ride type name, e.g. UberX, Comfort, XL"),
            price: z.string().describe("Price as shown, e.g. $12.50 or $15-18"),
            eta: z.string().optional().describe("ETA or wait time if shown"),
            capacity: z.string().optional().describe("Seat/capacity if shown"),
        }),
    ),
});

export type RideOption = z.infer<typeof rideOptionSchema>["rideOptions"][number];

/** Turn agent/extract output into a string suitable for AI extraction (never "[object Object]"). */
function toRawText(value: unknown): string {
    if (value == null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

/** Extract structured ride options from raw text using AI SDK generateObject. Returns array (empty if none found) for consistent UI. */
async function extractRideOptionsFromText(rawText: string): Promise<RideOption[]> {
    const text = rawText?.trim() ?? "";
    if (text.length < 2) {
        console.log("  [Ride] extractRideOptionsFromText: skipped (empty or too short)");
        return [];
    }
    try {
        const model = createModel();
        const { object } = await generateObject({
            model,
            schema: rideOptionSchema,
            prompt: `You are extracting ride-share options from text. The text may be from an AI assistant, a webpage, or raw notes. Extract every ride type with its price.

Rules:
- For each option output: name (e.g. UberX, Comfort, UberXL), price (exactly as shown, e.g. $12.50), and optionally eta or capacity if present.
- Accept bullet points, prose, or mixed format. Look for patterns like "UberX - $15" or "Comfort: $18.50 (5 min wait)".
- If you cannot find any ride options, return an empty rideOptions array.

Text to extract from:
${text}`,
        });
        const list = object?.rideOptions;
        if (Array.isArray(list) && list.length > 0) {
            console.log("  [Ride] extractRideOptionsFromText: got", list.length, "options");
            return list;
        }
        console.log("  [Ride] extractRideOptionsFromText: no options found in text");
        return [];
    } catch (e) {
        console.error("  [Ride] extractRideOptionsFromText failed:", e);
        return [];
    }
}

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
const RIDE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Normalize location for cache key (trim, lowercase, collapse spaces). */
function normalizeLocation(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Return cached ride result if same pickup/destination was looked up within the last 2 minutes. */
async function getCachedRideLookup(pickup: string, destination: string): Promise<{ pickup: string; destination: string; prices: string; rideOptions?: RideOption[] } | null> {
    try {
        const db = await getDb();
        const pickupNorm = normalizeLocation(pickup);
        const destinationNorm = normalizeLocation(destination);
        const since = new Date(Date.now() - RIDE_CACHE_TTL_MS);
        const doc = await db.collection("ride_lookups_cache").findOne(
            {
                pickupNorm,
                destinationNorm,
                createdAt: { $gte: since },
            },
            { sort: { createdAt: -1 } },
        );
        if (!doc?.prices) return null;
        return {
            pickup: doc.pickup,
            destination: doc.destination,
            prices: doc.prices,
            ...(Array.isArray(doc.rideOptions) && doc.rideOptions.length > 0 && { rideOptions: doc.rideOptions as RideOption[] }),
        };
    } catch (e) {
        console.error("  [Ride] Cache read failed:", e);
        return null;
    }
}

/** Store latest ride lookup (for getLastRideLookup) and add to cache for same-route reuse. */
async function saveRideLookup(pickup: string, destination: string, prices: string, rideOptions?: RideOption[]) {
    try {
        const db = await getDb();
        const now = new Date();
        const pickupNorm = normalizeLocation(pickup);
        const destinationNorm = normalizeLocation(destination);
        const rideDoc: Record<string, unknown> = { id: RIDE_LOOKUP_ID, pickup, destination, prices, createdAt: now };
        if (Array.isArray(rideOptions) && rideOptions.length > 0) rideDoc.rideOptions = rideOptions;
        await db.collection("ride_lookups").replaceOne({ id: RIDE_LOOKUP_ID }, rideDoc, { upsert: true });
        const cacheDoc: Record<string, unknown> = {
            pickupNorm,
            destinationNorm,
            pickup,
            destination,
            prices,
            createdAt: now,
        };
        if (Array.isArray(rideOptions) && rideOptions.length > 0) cacheDoc.rideOptions = rideOptions;
        await db.collection("ride_lookups_cache").insertOne(cacheDoc);
        // Keep cache bounded: remove entries older than 1 hour
        await db.collection("ride_lookups_cache").deleteMany({ createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } });
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
        const cached = await getCachedRideLookup(pickup, destination);
        if (cached) {
            console.log("  [Ride] Using cached result (same route within 2 min)");
            let rideOptions: RideOption[] = cached.rideOptions ?? [];
            if (rideOptions.length === 0 && cached.prices) {
                rideOptions = await extractRideOptionsFromText(cached.prices);
                if (rideOptions.length) console.log("  [Ride] Cached entry had no rideOptions; extracted", rideOptions.length);
            }
            console.log("  [Ride] Uber data:", { pickup: cached.pickup, destination: cached.destination, prices: cached.prices?.slice(0, 80) + "...", rideOptions: rideOptions.length });
            return {
                success: true,
                pickup: cached.pickup,
                destination: cached.destination,
                prices: cached.prices,
                rideOptions,
                fromCache: true,
            };
        }

        let stagehand: Stagehand | null = null;
        let liveViewUrl: string | undefined;
        try {
            stagehand = await createStagehandWithContext();
            const sessionId = stagehand.browserbaseSessionID;
            if (sessionId) {
                try {
                    const debug = await bb.sessions.debug(sessionId);
                    liveViewUrl = debug.debuggerFullscreenUrl;
                } catch {
                    // ignore debug URL errors
                }
            }
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
1. Enter "${pickup}" as the pickup location, wait for the suggestions to load, then press Enter on the keyboard to select the first suggestion.
2. Enter "${destination}" as the destination, wait for the suggestions to load, then press Enter on the keyboard to select the first suggestion.
3. Click Search or See Prices.
4. Wait for ride options to load.
5. If you get captcha, solve it and continue.
6. Extract ALL available ride types with their prices and ETAs exactly as shown on the page.
Do NOT take screenshots. Do NOT book any ride. Just give the prices as you see them.
          `,
                    maxSteps: 25,
                });
            } catch (agentErr: any) {
                // The CUA agent has a known bug where it completes the task
                // successfully but throws a ModelMessage error on the final
                // "done" step. When this happens the page is still showing
                // ride prices, so we fall back to extract().
                const isModelMsgBug = agentErr.message?.includes("ModelMessage") || agentErr.message?.includes("UIMessage");

                if (!isModelMsgBug) throw agentErr;

                console.log("  [Ride] CUA agent hit ModelMessage bug — falling back to extract()");

                const extractInstruction =
                    "Extract ALL Uber ride types visible on this page. For each option include: name (e.g. UberX, Comfort, UberXL), price (exactly as shown), and optionally eta/wait time and capacity if shown.";

                let rideOptions: RideOption[] = [];
                let rawText = "";

                try {
                    const structured = await stagehand.extract(extractInstruction, rideOptionSchema);
                    const list = structured?.rideOptions;
                    if (Array.isArray(list) && list.length > 0) {
                        rideOptions = list as RideOption[];
                        rawText = list.map((o) => `${o.name}: ${o.price}${o.eta ? ` (${o.eta})` : ""}`).join("\n");
                        console.log("  [Ride] Browserbase structured extract: got", rideOptions.length, "options");
                    }
                } catch (schemaErr) {
                    console.log("  [Ride] Structured extract failed, using text extract:", (schemaErr as Error).message);
                }

                if (rideOptions.length === 0) {
                    const extracted = await stagehand.extract(extractInstruction);
                    rawText = toRawText(extracted.extraction);
                    rideOptions = await extractRideOptionsFromText(rawText);
                }

                const fallbackResult = {
                    success: true,
                    pickup,
                    destination,
                    prices: rawText,
                    rideOptions,
                    ...(liveViewUrl && { liveViewUrl }),
                };
                console.log("  [Ride] Uber data (Browserbase extract):", { pickup, destination, prices: rawText?.slice(0, 80) + "...", rideOptions: rideOptions.length });
                await saveRideLookup(pickup, destination, rawText, rideOptions);
                return fallbackResult;
            }

            const rawMessage = toRawText(agentResult.message);
            const rideOptions = await extractRideOptionsFromText(rawMessage);
            const result = {
                success: agentResult.success,
                pickup,
                destination,
                prices: rawMessage,
                rideOptions,
                steps: agentResult.actions?.length ?? 0,
                ...(liveViewUrl && { liveViewUrl }),
            };
            console.log("  [Ride] Uber data (Browserbase agent):", { pickup, destination, prices: rawMessage?.slice(0, 80) + "...", rideOptions: rideOptions.length, steps: result.steps });
            if (result.success && rawMessage) {
                await saveRideLookup(pickup, destination, rawMessage, rideOptions);
            }
            return result;
        } catch (err: any) {
            return {
                success: false,
                error: `Ride price lookup failed: ${err.message}`,
                suggestion: "Make sure UBER_CONTEXT_ID is set and the Uber session is still valid. " + "Re-run 'npx tsx src/uber-login.ts' if needed.",
                ...(liveViewUrl && { liveViewUrl }),
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
                rideOptions: Array.isArray(doc.rideOptions) ? doc.rideOptions : [],
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
