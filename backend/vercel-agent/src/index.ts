import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { streamText, generateText } from "ai";
import { createModel, getSystemPrompt } from "./agent.js";
import { allTools } from "./tools/index.js";

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
/*  Voice chat — the main endpoint for the mobile app                  */
/*  Accepts audio file + conversation history                          */
/*  Returns transcript, AI response text, and TTS audio as base64      */
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
            });
            return;
        }

        // Step 2: Add user message and run AI agent
        messages.push({ role: "user", content: transcript });

        console.log(`  [AI] Generating response...`);
        const { text: aiResponse } = await generateText({
            model,
            system: systemPrompt,
            messages,
            tools: allTools,
            maxSteps: 10,
        });
        console.log(`  [AI] "${aiResponse}"`);

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
            tools: allTools,
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
            tools: allTools,
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
    console.log(`    POST /api/voice-chat — voice conversation (audio in, audio+text out)`);
    console.log(`    POST /api/tts        — text to speech`);
    console.log(`    POST /api/chat       — streaming text chat`);
    console.log(`    POST /api/generate   — non-streaming text chat`);
    console.log(`    GET  /api/health     — health check\n`);
});
