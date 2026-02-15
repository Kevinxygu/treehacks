import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { ObjectId } from "mongodb";
import { streamText, generateText } from "ai";
import { createModel, getSystemPrompt } from "./agent.js";
import { allTools, getRemoteTools } from "./tools/index.js";
import { getDb } from "./db.js";

const tools = process.env.TOOLS_SERVERLESS_URL ? getRemoteTools(process.env.TOOLS_SERVERLESS_URL) : allTools;
if (process.env.TOOLS_SERVERLESS_URL) {
    console.log("  Using remote tools at", process.env.TOOLS_SERVERLESS_URL);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const model = createModel();

// Preload the system prompt (includes user profile from DB)
let systemPromptReady: Promise<string>;

/* ------------------------------------------------------------------ */
/*  ElevenLabs helpers                                                 */
/* ------------------------------------------------------------------ */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

function elevenLabsHeaders() {
    return { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" };
}

/** Speech-to-text via ElevenLabs Scribe v2 */
async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append("model_id", "scribe_v2");
    formData.append("language_code", "en");
    formData.append("tag_audio_events", "false");
    formData.append("file", new Blob([audioBuffer]), filename);

    const res = await fetch(`${ELEVENLABS_BASE}/speech-to-text`, {
        method: "POST",
        headers: elevenLabsHeaders(),
        body: formData,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ElevenLabs STT error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.text ?? "";
}

/** Text-to-speech via ElevenLabs Text-to-Dialogue */
async function textToSpeech(text: string): Promise<Buffer> {
    const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "uYXf8XasLslADfZ2MB4u";

    const res = await fetch(`${ELEVENLABS_BASE}/text-to-dialogue`, {
        method: "POST",
        headers: {
            ...elevenLabsHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: [{ text, voice_id: voiceId }],
            model_id: "eleven_v3",
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ElevenLabs TTS error ${res.status}: ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/* ------------------------------------------------------------------ */
/*  Health check                                                       */
/* ------------------------------------------------------------------ */

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------------------ */
/*  Config API — CRUD for user profile, medications, contacts, bills   */
/* ------------------------------------------------------------------ */

function toJson(doc: any) {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    return _id ? { _id: _id.toString(), ...rest } : rest;
}

app.get("/api/config/profile", async (_req, res) => {
    try {
        const db = await getDb();
        const doc = await db.collection("user_profile").findOne();
        res.json(toJson(doc));
    } catch (err: any) {
        console.error("Config profile GET:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/config/profile", async (req, res) => {
    try {
        const db = await getDb();
        const existing = await db.collection("user_profile").findOne();
        const body = req.body || {};
        const doc = {
            name: body.name ?? existing?.name ?? "",
            email: body.email ?? existing?.email ?? "",
            date_of_birth: body.date_of_birth ?? existing?.date_of_birth ?? "",
            allergies: body.allergies ?? existing?.allergies ?? "",
            primary_doctor: body.primary_doctor ?? existing?.primary_doctor ?? "",
            pharmacy_name: body.pharmacy_name ?? existing?.pharmacy_name ?? "",
            pharmacy_phone: body.pharmacy_phone ?? existing?.pharmacy_phone ?? "",
            address: body.address ?? existing?.address ?? "",
            notes: body.notes ?? existing?.notes ?? "",
        };
        if (existing) {
            await db.collection("user_profile").updateOne({ _id: existing._id }, { $set: doc });
        } else {
            await db.collection("user_profile").insertOne(doc);
        }
        res.json(toJson(doc));
    } catch (err: any) {
        console.error("Config profile PUT:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/config/medications", async (_req, res) => {
    try {
        const db = await getDb();
        const list = await db.collection("medications").find().toArray();
        res.json(list.map(toJson));
    } catch (err: any) {
        console.error("Config medications GET:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/config/medications", async (req, res) => {
    try {
        const db = await getDb();
        const body = req.body || {};
        const doc = {
            name: body.name ?? "",
            dosage: body.dosage ?? "",
            frequency: body.frequency ?? "",
            time_of_day: body.time_of_day ?? "",
            start_date: body.start_date ?? new Date().toISOString().split("T")[0],
            prescribing_doctor: body.prescribing_doctor ?? "",
            notes: body.notes ?? "",
        };
        const result = await db.collection("medications").insertOne(doc);
        res.status(201).json(toJson({ _id: result.insertedId, ...doc }));
    } catch (err: any) {
        console.error("Config medications POST:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/config/medications/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid medication id" });
            return;
        }
        const body = req.body || {};
        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.dosage !== undefined) updates.dosage = body.dosage;
        if (body.frequency !== undefined) updates.frequency = body.frequency;
        if (body.time_of_day !== undefined) updates.time_of_day = body.time_of_day;
        if (body.start_date !== undefined) updates.start_date = body.start_date;
        if (body.prescribing_doctor !== undefined) updates.prescribing_doctor = body.prescribing_doctor;
        if (body.notes !== undefined) updates.notes = body.notes;
        const result = await db.collection("medications").updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Medication not found" });
            return;
        }
        const doc = await db.collection("medications").findOne({ _id: new ObjectId(id) });
        res.json(toJson(doc));
    } catch (err: any) {
        console.error("Config medications PUT:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/config/medications/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid medication id" });
            return;
        }
        const result = await db.collection("medications").deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Medication not found" });
            return;
        }
        res.json({ success: true });
    } catch (err: any) {
        console.error("Config medications DELETE:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/config/emergency-contacts", async (_req, res) => {
    try {
        const db = await getDb();
        const list = await db.collection("emergency_contacts").find().toArray();
        res.json(list.map(toJson));
    } catch (err: any) {
        console.error("Config emergency-contacts GET:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/config/emergency-contacts", async (req, res) => {
    try {
        const db = await getDb();
        const body = req.body || {};
        const doc = {
            name: body.name ?? "",
            phone: body.phone ?? "",
            email: body.email ?? "",
            relation: body.relation ?? "",
            is_primary: !!body.is_primary,
        };
        const result = await db.collection("emergency_contacts").insertOne(doc);
        res.status(201).json(toJson({ _id: result.insertedId, ...doc }));
    } catch (err: any) {
        console.error("Config emergency-contacts POST:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/config/emergency-contacts/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid contact id" });
            return;
        }
        const body = req.body || {};
        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.phone !== undefined) updates.phone = body.phone;
        if (body.email !== undefined) updates.email = body.email;
        if (body.relation !== undefined) updates.relation = body.relation;
        if (body.is_primary !== undefined) updates.is_primary = !!body.is_primary;
        const result = await db.collection("emergency_contacts").updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Contact not found" });
            return;
        }
        const doc = await db.collection("emergency_contacts").findOne({ _id: new ObjectId(id) });
        res.json(toJson(doc));
    } catch (err: any) {
        console.error("Config emergency-contacts PUT:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/config/emergency-contacts/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid contact id" });
            return;
        }
        const result = await db.collection("emergency_contacts").deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Contact not found" });
            return;
        }
        res.json({ success: true });
    } catch (err: any) {
        console.error("Config emergency-contacts DELETE:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/config/bill-reminders", async (_req, res) => {
    try {
        const db = await getDb();
        const list = await db.collection("bill_reminders").find().sort({ due_date: 1 }).toArray();
        res.json(list.map(toJson));
    } catch (err: any) {
        console.error("Config bill-reminders GET:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/config/bill-reminders", async (req, res) => {
    try {
        const db = await getDb();
        const body = req.body || {};
        const doc = {
            name: body.name ?? "",
            due_date: body.due_date ?? "",
            amount: typeof body.amount === "number" ? body.amount : parseFloat(body.amount) || 0,
            paid: !!body.paid,
            recurrence: body.recurrence ?? "monthly",
        };
        const result = await db.collection("bill_reminders").insertOne(doc);
        res.status(201).json(toJson({ _id: result.insertedId, ...doc }));
    } catch (err: any) {
        console.error("Config bill-reminders POST:", err);
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/config/bill-reminders/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid bill id" });
            return;
        }
        const body = req.body || {};
        const updates: any = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.due_date !== undefined) updates.due_date = body.due_date;
        if (body.amount !== undefined) updates.amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount) || 0;
        if (body.paid !== undefined) updates.paid = !!body.paid;
        if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
        const result = await db.collection("bill_reminders").updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Bill not found" });
            return;
        }
        const doc = await db.collection("bill_reminders").findOne({ _id: new ObjectId(id) });
        res.json(toJson(doc));
    } catch (err: any) {
        console.error("Config bill-reminders PUT:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/config/bill-reminders/:id", async (req, res) => {
    try {
        const db = await getDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid bill id" });
            return;
        }
        const result = await db.collection("bill_reminders").deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "Bill not found" });
            return;
        }
        res.json({ success: true });
    } catch (err: any) {
        console.error("Config bill-reminders DELETE:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Cards from tool results — for mobile UI (ride options, meds, etc.) */
/* ------------------------------------------------------------------ */

type CardItem = { id?: string; title: string; subtitle?: string; [k: string]: unknown };
type ResponseCard = { type: string; title: string; items?: CardItem[]; data?: Record<string, unknown> };

/** Extract first liveViewUrl from any tool result (e.g. getRidePrices). */
function getLiveViewUrlFromSteps(steps: Array<{ toolResults: Array<{ toolName: string; result: unknown }> }>): string | undefined {
    for (const step of steps) {
        for (const tr of step.toolResults || []) {
            const result = tr.result as Record<string, unknown> | null | undefined;
            if (result && typeof result === "object" && typeof result.liveViewUrl === "string") return result.liveViewUrl as string;
        }
    }
    return undefined;
}

function buildCardsFromToolResults(steps: Array<{ toolResults: Array<{ toolName: string; result: unknown }> }>): ResponseCard[] {
    const cards: ResponseCard[] = [];
    for (const step of steps) {
        for (const tr of step.toolResults || []) {
            const name = tr.toolName;
            const result = tr.result as Record<string, unknown> | unknown[] | null | undefined;
            if (!result || typeof result !== "object") continue;

            if (name === "getRidePrices" && result && !Array.isArray(result) && "pickup" in result) {
                const r = result as {
                    pickup?: string;
                    destination?: string;
                    prices?: string;
                    success?: boolean;
                    rideOptions?: Array<{ name: string; price: string; eta?: string; capacity?: string }>;
                };
                const hasStructured = r.rideOptions && Array.isArray(r.rideOptions) && r.rideOptions.length > 0;
                if (hasStructured) console.log("  [Cards] getRidePrices: using", r.rideOptions!.length, "structured ride options");
                if (r.success && (r.prices || r.pickup || hasStructured)) {
                    const opts = r.rideOptions ?? [];
                    const items =
                        opts.length > 0
                            ? opts.map((o, i) => ({
                                  id: String(i),
                                  title: o.name,
                                  subtitle: [o.price, o.eta, o.capacity].filter(Boolean).join(" · "),
                              }))
                            : undefined;
                    cards.push({
                        type: "ride_options",
                        title: "Ride options",
                        data: {
                            pickup: r.pickup,
                            destination: r.destination,
                            prices: r.prices,
                        },
                        ...(items?.length && { items }),
                    });
                }
                continue;
            }
            if (name === "getLastRideLookup" && result && !Array.isArray(result) && "hasLookup" in result) {
                const r = result as {
                    hasLookup?: boolean;
                    pickup?: string;
                    destination?: string;
                    prices?: string;
                    rideOptions?: Array<{ name: string; price: string; eta?: string; capacity?: string }>;
                };
                const hasStructuredLast = r.rideOptions && Array.isArray(r.rideOptions) && r.rideOptions.length > 0;
                if (hasStructuredLast) console.log("  [Cards] getLastRideLookup: using", r.rideOptions!.length, "structured ride options");
                if (r.hasLookup && (r.prices || hasStructuredLast)) {
                    const opts = r.rideOptions ?? [];
                    const items =
                        opts.length > 0
                            ? opts.map((o, i) => ({
                                  id: String(i),
                                  title: o.name,
                                  subtitle: [o.price, o.eta, o.capacity].filter(Boolean).join(" · "),
                              }))
                            : undefined;
                    cards.push({
                        type: "ride_options",
                        title: "Last ride lookup",
                        data: { pickup: r.pickup, destination: r.destination, prices: r.prices },
                        ...(items?.length && { items }),
                    });
                }
                continue;
            }
            if (name === "getMedications" && Array.isArray(result)) {
                const items: CardItem[] = result.map((m: Record<string, unknown>, i: number) => ({
                    id: String(i),
                    title: String(m.name ?? "Medication"),
                    subtitle: [m.dosage, m.frequency, m.time_of_day].filter(Boolean).join(" · "),
                    ...m,
                }));
                cards.push({ type: "medications", title: "Medication schedule", items });
                continue;
            }
            if (name === "getEmergencyContacts" && Array.isArray(result)) {
                const items: CardItem[] = result.map((c: Record<string, unknown>, i: number) => ({
                    id: String(i),
                    title: String(c.name ?? "Contact"),
                    subtitle: [c.relation, c.phone].filter(Boolean).join(" · "),
                    ...c,
                }));
                cards.push({ type: "contacts", title: "Emergency contacts", items });
                continue;
            }
            if (name === "getBillReminders" && Array.isArray(result)) {
                const items: CardItem[] = result.map((b: Record<string, unknown>, i: number) => ({
                    id: String(i),
                    title: String(b.name ?? "Bill"),
                    subtitle: b.due_date ? `Due ${b.due_date} · $${Number(b.amount ?? 0).toFixed(2)}` : undefined,
                    ...b,
                }));
                cards.push({ type: "bills", title: "Bill reminders", items });
                continue;
            }
            // Weather
            if (name === "getWeather" && result && !Array.isArray(result) && "location" in result && !("error" in result)) {
                const r = result as {
                    location: string;
                    current?: { temperature?: string; condition?: string; wind_speed?: string; humidity?: string };
                    forecast?: Array<{ date: string; high?: string; low?: string; condition?: string; rain_chance?: string }>;
                };
                const items: CardItem[] = [];
                if (r.current) {
                    items.push({
                        id: "current",
                        title: r.current.condition ?? "Current",
                        subtitle: [r.current.temperature, r.current.humidity, r.current.wind_speed].filter(Boolean).join(" · "),
                    });
                }
                if (r.forecast?.length) {
                    r.forecast.forEach((d, i) => {
                        items.push({
                            id: `day-${i}`,
                            title: d.date,
                            subtitle: [d.high, d.low, d.condition, d.rain_chance].filter(Boolean).join(" · "),
                        });
                    });
                }
                cards.push({
                    type: "weather",
                    title: "Weather",
                    data: { location: r.location },
                    ...(items.length && { items }),
                });
                continue;
            }
            // Meeting / appointment tools
            if (name === "getEventTypes" && result && !Array.isArray(result) && "eventTypes" in result) {
                const r = result as { eventTypes?: Array<{ id?: string; title?: string; lengthInMinutes?: number; description?: string }> };
                const list = r.eventTypes ?? [];
                const items: CardItem[] = list.map((et, i) => ({
                    id: String(et.id ?? i),
                    title: String(et.title ?? `${et.lengthInMinutes ?? "?"} min`),
                    subtitle: et.description ?? (et.lengthInMinutes ? `${et.lengthInMinutes} min` : undefined),
                }));
                if (items.length) cards.push({ type: "meeting_types", title: "Meeting types", items });
                continue;
            }
            if (name === "getAvailableSlots" && result && !Array.isArray(result) && "availableSlots" in result) {
                const r = result as {
                    durationMinutes?: number;
                    availableSlots?: Array<{ date: string; slots: Array<{ localTime: string; utc: string }> }>;
                };
                const slots = r.availableSlots ?? [];
                const items: CardItem[] = slots.flatMap((day) =>
                    day.slots.slice(0, 6).map((s, i) => ({
                        id: `${day.date}-${i}`,
                        title: day.date,
                        subtitle: s.localTime,
                        utc: s.utc,
                    })),
                );
                if (items.length)
                    cards.push({
                        type: "meeting_slots",
                        title: `Available ${r.durationMinutes ?? ""} min slots`.trim(),
                        data: { durationMinutes: r.durationMinutes },
                        items,
                    });
                continue;
            }
            if (name === "bookAppointment" && result && !Array.isArray(result) && "success" in result && (result as { success?: boolean }).success) {
                const r = result as { localTime?: string; meetingUrl?: string | null; message?: string };
                cards.push({
                    type: "meeting_booked",
                    title: "Appointment booked",
                    data: { localTime: r.localTime, meetingUrl: r.meetingUrl, message: r.message },
                });
                continue;
            }
            if (name === "getUpcomingAppointments" && result && !Array.isArray(result) && "bookings" in result) {
                const r = result as { bookings?: Array<{ title?: string; localStart?: string; location?: string }> };
                const list = r.bookings ?? [];
                const items: CardItem[] = list.map((b, i) => ({
                    id: String(i),
                    title: String(b.title ?? "Appointment"),
                    subtitle: [b.localStart, b.location].filter(Boolean).join(" · "),
                }));
                if (items.length) cards.push({ type: "meetings", title: "Upcoming appointments", items });
                continue;
            }
        }
    }
    return cards;
}

/* ------------------------------------------------------------------ */
/*  Voice chat — the main endpoint for the mobile app                  */
/*  Accepts audio file + conversation history                          */
/*  Returns transcript, AI response text, TTS audio, and optional cards*/
/* ------------------------------------------------------------------ */

app.post("/api/voice-chat", upload.single("audio"), async (req, res) => {
    try {
        const systemPrompt = await systemPromptReady;

        // Parse conversation history from the request
        let messages: any[] = [];
        if (req.body.messages) {
            try {
                messages = typeof req.body.messages === "string" ? JSON.parse(req.body.messages) : req.body.messages;
            } catch {
                /* start fresh */
            }
        }

        // Step 1: Transcribe audio via ElevenLabs
        let transcript = "";
        if (req.file) {
            console.log(`  [STT] Transcribing ${req.file.originalname} (${req.file.size} bytes)...`);
            transcript = await transcribeAudio(req.file.buffer, req.file.originalname ?? "audio.m4a");
            console.log(`  [STT] "${transcript}"`);
        } else if (req.body.text) {
            // Fallback: accept text directly
            transcript = req.body.text;
        } else {
            res.status(400).json({ error: "No audio file or text provided" });
            return;
        }

        if (!transcript.trim()) {
            res.json({
                transcript: "",
                response: "I didn't catch that. Could you try again?",
                audioBase64: null,
                cards: [],
                liveViewUrl: undefined,
            });
            return;
        }

        // Step 2: Add user message and run AI agent
        messages.push({ role: "user", content: transcript });

        console.log(`  [AI] Generating response...`);
        const result = await generateText({
            model,
            system: systemPrompt,
            messages,
            tools,
            maxSteps: 10,
        });
        const aiResponse = result.text;
        const steps = await result.steps;
        console.log(`  [AI] "${aiResponse}"`);

        const stepsTyped = steps as Array<{ toolResults: Array<{ toolName: string; result: unknown }> }>;
        const cards = buildCardsFromToolResults(stepsTyped);
        const liveViewUrl = getLiveViewUrlFromSteps(stepsTyped);

        // Step 3: Convert AI response to speech via ElevenLabs
        let audioBase64: string | null = null;
        if (aiResponse) {
            console.log(`  [TTS] Converting to speech...`);
            const audioBuffer = await textToSpeech(aiResponse);
            audioBase64 = audioBuffer.toString("base64");
            console.log(`  [TTS] Audio: ${audioBuffer.length} bytes`);
        }

        res.json({
            transcript,
            response: aiResponse,
            audioBase64,
            cards,
            ...(liveViewUrl && { liveViewUrl }),
        });
    } catch (err: any) {
        console.error("Voice chat error:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Standalone TTS endpoint                                            */
/* ------------------------------------------------------------------ */

app.post("/api/tts", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            res.status(400).json({ error: "text is required" });
            return;
        }

        const audioBuffer = await textToSpeech(text);
        res.set("Content-Type", "audio/mpeg");
        res.send(audioBuffer);
    } catch (err: any) {
        console.error("TTS error:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Streaming chat endpoint (for web / useChat)                        */
/* ------------------------------------------------------------------ */

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: "messages array is required" });
            return;
        }

        const systemPrompt = await systemPromptReady;

        const result = streamText({
            model,
            system: systemPrompt,
            messages,
            tools,
            maxSteps: 10,
            onError: (err) => {
                console.error("Stream error:", err);
            },
        });

        result.pipeUIMessageStreamToResponse(res);
    } catch (err: any) {
        console.error("Chat error:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Non-streaming chat endpoint                                        */
/* ------------------------------------------------------------------ */

app.post("/api/generate", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: "messages array is required" });
            return;
        }

        const systemPrompt = await systemPromptReady;

        const { text, toolResults } = await generateText({
            model,
            system: systemPrompt,
            messages,
            tools,
            maxSteps: 10,
        });

        res.json({
            response: text,
            toolResults,
        });
    } catch (err: any) {
        console.error("Generate error:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ------------------------------------------------------------------ */
/*  Start server                                                       */
/* ------------------------------------------------------------------ */

const PORT = parseInt(process.env.PORT ?? "3001", 10);

systemPromptReady = getSystemPrompt();
systemPromptReady.then(() => {
    console.log("  User profile loaded into system prompt.");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  Elder Care Agent API running on http://localhost:${PORT}`);
    console.log(`  Endpoints:`);
    console.log(`    GET  /api/health     — health check`);
    console.log(`    GET/PUT /api/config/profile`);
    console.log(`    GET/POST/PUT/DELETE /api/config/medications`);
    console.log(`    GET/POST/PUT/DELETE /api/config/emergency-contacts`);
    console.log(`    GET/POST/PUT/DELETE /api/config/bill-reminders`);
    console.log(`    POST /api/voice-chat — voice conversation (audio in, audio+text out)`);
    console.log(`    POST /api/tts        — text to speech`);
    console.log(`    POST /api/chat       — streaming text chat`);
    console.log(`    POST /api/generate   — non-streaming text chat`);
    if (process.env.TOOLS_SERVERLESS_URL) {
        console.log(`    (tools run remotely at ${process.env.TOOLS_SERVERLESS_URL})`);
    }
    console.log("");
});
