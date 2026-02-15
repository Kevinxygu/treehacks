import { tool } from "ai";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Grocery ordering via Browserbase/Stagehand (Instacart)             */
/* ------------------------------------------------------------------ */

async function createStagehand() {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;
    const modelApiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_GATEWAY_API_KEY;

    if (!apiKey || !projectId) {
        throw new Error("BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID must be set.");
    }

    const { Stagehand } = await import("@browserbasehq/stagehand");

    const stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey,
        projectId,
        model: {
            modelName: "anthropic/claude-sonnet-4-20250514",
            apiKey: modelApiKey,
        },
    });
    await stagehand.init();
    return stagehand;
}

export const orderGroceries = tool({
    description: "Order groceries via Instacart using an automated browser session. " + "Always confirm the grocery list with the user before calling this.",
    parameters: z.object({
        items: z.array(z.string()).describe("List of grocery items to order (e.g. ['milk', 'bread', 'eggs'])"),
        store: z.string().optional().describe("Preferred store (e.g. 'Costco', 'Safeway')"),
    }),
    execute: async ({ items, store }) => {
        let stagehand: any = null;
        try {
            stagehand = await createStagehand();
            const page = stagehand.context.pages()[0];

            let url = "https://www.instacart.com";
            if (store) {
                url = `https://www.instacart.com/store/${store.toLowerCase().replace(/\s+/g, "-")}`;
            }
            await page.goto(url, { waitUntil: "networkidle" });
            await page.waitForTimeout(2000);

            const addedItems: string[] = [];
            const failedItems: string[] = [];

            for (const item of items) {
                try {
                    await stagehand.act(`Find the search bar and search for "${item}"`);
                    await page.waitForTimeout(2000);
                    await stagehand.act(`Click "Add to cart" on the first result for "${item}"`);
                    await page.waitForTimeout(1000);
                    addedItems.push(item);
                } catch {
                    failedItems.push(item);
                }
            }

            return {
                success: true,
                added: addedItems,
                failed: failedItems,
                note: "User needs to be logged into Instacart to checkout.",
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        } finally {
            if (stagehand) await stagehand.close().catch(() => {});
        }
    },
});

export const groceryTools = {
    orderGroceries,
};
