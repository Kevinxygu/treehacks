import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { getDb } from "./db.js";

/* ------------------------------------------------------------------ */
/*  Model setup – supports Vercel AI Gateway or direct Anthropic      */
/* ------------------------------------------------------------------ */

export function createModel(): LanguageModel {
    const modelId = process.env.MODEL_ID ?? "claude-sonnet-4-20250514";

    // Prefer AI Gateway if key is provided (one key → any provider)
    if (process.env.AI_GATEWAY_API_KEY) {
        const gateway = createOpenAI({
            baseURL: "https://ai-gateway.vercel.sh/v1",
            apiKey: process.env.AI_GATEWAY_API_KEY,
        });
        console.log(`Using Vercel AI Gateway → ${modelId}`);
        return gateway(modelId);
    }

    // Fallback: direct Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = createAnthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        console.log(`Using Anthropic direct → ${modelId}`);
        return anthropic(modelId);
    }

    throw new Error("Set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY in your .env file.");
}

/* ------------------------------------------------------------------ */
/*  System prompt — built dynamically with user profile               */
/* ------------------------------------------------------------------ */

const BASE_PROMPT = `\
You are a voice assistant for an elderly person. Your responses will be read aloud, \
so write exactly how you would speak. Keep it warm, natural, and brief.

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

You can help with medications, doctor appointments, Uber rides, groceries, email, bills, weather, and emergency contacts.

The user's data is in a database. Contacts have names, phones, and emails, so the user \
can say things like "email Sarah" and you find Sarah's email automatically.

When the user asks a follow-up about a ride search they already did (e.g. "what was the UberX price?", "which was cheapest?", "how much for Comfort?") use getLastRideLookup to get the stored prices instead of running a new search.

Voice rules — these are critical because your text becomes speech:
- Keep responses to one to three sentences. Be concise.
- Spell out numbers and money. Say "eighty five dollars" not "$85". Say "February twentieth" not "Feb 20th".
- Never use bullet points, lists, dashes, asterisks, or any formatting. Just flowing sentences.
- Never say URLs, file paths, or technical terms.
- Use commas and periods for natural pauses.
- If listing things, say them in a sentence. Like "You're taking Metformin, Lisinopril, Atorvastatin, and Vitamin D."
- Don't repeat what the user said back to them.
- For appointments, never ask for name or email. The tool pulls that from their profile. Just confirm the time.
- Notes for appointments are optional. Don't ask unless the user offers a reason.
- If it's a medical emergency, tell them to call 9 1 1 right away.
- When showing available appointment times, only mention a few good options, not every single slot.
`;

let _cachedPrompt: string | null = null;

/**
 * Build the system prompt with the user's profile baked in.
 * Loaded once from MongoDB, then cached for the session.
 */
export async function getSystemPrompt(): Promise<string> {
    if (_cachedPrompt) return _cachedPrompt;

    try {
        const db = await getDb();
        const profile = await db.collection("user_profile").findOne();
        const contacts = await db.collection("emergency_contacts").find().toArray();
        const meds = await db.collection("medications").find().toArray();

        let userContext = "\nAbout this user:\n";

        if (profile) {
            userContext += `Name: ${profile.name}\n`;
            if (profile.email) userContext += `Email: ${profile.email}\n`;
            if (profile.date_of_birth) userContext += `Date of birth: ${profile.date_of_birth}\n`;
            if (profile.allergies) userContext += `Allergies: ${profile.allergies}\n`;
            if (profile.primary_doctor) userContext += `Primary doctor: ${profile.primary_doctor}\n`;
            if (profile.pharmacy_name) userContext += `Pharmacy: ${profile.pharmacy_name} (${profile.pharmacy_phone})\n`;
            if (profile.address) userContext += `Address: ${profile.address}\n`;
            if (profile.notes) userContext += `Notes: ${profile.notes}\n`;
        }

        if (contacts.length > 0) {
            userContext += "\nContacts:\n";
            for (const c of contacts) {
                userContext += `- ${c.name} (${c.relation}) — ${c.phone}`;
                if (c.email) userContext += `, ${c.email}`;
                if (c.is_primary) userContext += " [primary]";
                userContext += "\n";
            }
        }

        if (meds.length > 0) {
            userContext += "\nMedications:\n";
            for (const m of meds) {
                userContext += `- ${m.name} ${m.dosage}, ${m.frequency} at ${m.time_of_day}`;
                if (m.notes) userContext += ` (${m.notes})`;
                userContext += "\n";
            }
        }

        _cachedPrompt = BASE_PROMPT + userContext;
    } catch (err) {
        console.error("Failed to load user profile for prompt:", err);
        _cachedPrompt = BASE_PROMPT;
    }

    return _cachedPrompt;
}

// Keep a static export for backwards compat, but prefer getSystemPrompt()
export const SYSTEM_PROMPT = BASE_PROMPT;
