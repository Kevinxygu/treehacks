import { API_URL, FASTAPI_URL } from "@env";

// ------------------------------------------------------------------
// API Configuration
// Loaded from .env file for local development
// ------------------------------------------------------------------
const API_BASE = __DEV__
    ? "https://vercel-agent-two.vercel.app"
    : "https://your-production-api.com"; // production

const FASTAPI_BASE = __DEV__
    ? "https://treehacks-backend-pi.vercel.app"
    : "https://your-production-api.com";

// ---------- Types ----------

export interface VoiceChatResult {
    transcript: string;
    response: string;
    audioBase64: string | null;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

// ---------- API Calls ----------

/**
 * Send a recorded audio file + conversation history to the backend.
 * Uses fetch + FormData which is reliable across all React Native versions.
 */
export async function voiceChat(audioUri: string, messages: ChatMessage[]): Promise<VoiceChatResult> {
    const formData = new FormData();

    // React Native's FormData accepts this shape for file uploads
    formData.append("audio", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
    } as any);

    formData.append("messages", JSON.stringify(messages));

    const response = await fetch(`${API_BASE}/api/voice-chat`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type — fetch sets it automatically with the boundary
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Voice chat failed: ${response.status} - ${text}`);
    }

    return response.json();
}

/**
 * Text-only chat with the AI agent (no voice).
 * Returns the AI's text response.
 */
export async function textChat(messages: ChatMessage[]): Promise<{ response: string }> {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
        throw new Error(`Chat failed: ${res.status}`);
    }

    return res.json();
}

/**
 * Health-check — verify the backend is reachable.
 */
export async function ping(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/health`);
        return res.ok;
    } catch {
        return false;
    }
}

// ---------- Analysis API (FastAPI backend) ----------

export interface AnalysisResult {
    ai_summary: string;
    risk_score: number;
    rule_based_summary: string;
    session_id: string;
    session_date: string;
    rule_based: Record<string, unknown>;
}

/**
 * Send a transcript to the FastAPI backend for cognitive analysis.
 */
export async function analyzeTranscript(
    transcript: string,
    sessionId: string = "",
    sessionDate: string = "",
): Promise<AnalysisResult> {
    const res = await fetch(`${FASTAPI_BASE}/analyze-transcript-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            transcript,
            session_id: sessionId,
            session_date: sessionDate,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Analysis failed: ${res.status} - ${text}`);
    }

    return res.json();
}
