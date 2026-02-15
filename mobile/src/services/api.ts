import * as FileSystem from "expo-file-system";

// ------------------------------------------------------------------
// IMPORTANT: Change this to your machine's local IP when testing on
// a physical device.  "localhost" only works in the iOS simulator.
//
//   macOS:  ifconfig | grep "inet " | grep -v 127.0.0.1
//   The backend runs on port 8000 by default (uvicorn).
// ------------------------------------------------------------------
const API_BASE = __DEV__
  ? "http://localhost:8000" // simulator / same machine
  : "https://your-production-api.com"; // production

// ---------- Types ----------

export interface AnalysisResult {
  ai_summary: string;
  risk_score: number;
  rule_based_summary: string;
  session_id: string;
  session_date: string;
  rule_based: {
    session_id: string;
    session_date: string;
    total_words: number;
    unique_words: number;
    total_sentences: number;
    risk_score: number;
    summary: string;
    flagged_excerpts: string[];
    markers: {
      category: string;
      marker: string;
      value: number;
      threshold: number;
      flagged: boolean;
      severity: string;
      evidence: string[];
    }[];
    raw_metrics: Record<string, number | string[]>;
  };
}

// ---------- API Calls ----------

/**
 * Upload a recorded audio file to the backend for transcription +
 * cognitive analysis.  The backend is expected to:
 *   1. Transcribe the audio (Vital API / Whisper / etc.)
 *   2. Run rule-based analysis
 *   3. Generate an AI summary
 *   4. Return the full AnalysisResult
 *
 * Until that endpoint exists we fall back to /analyze-transcript-ai
 * with dummy text so the rest of the pipeline works.
 */
export async function uploadAudioForAnalysis(
  audioUri: string,
  sessionId: string,
): Promise<AnalysisResult> {
  const today = new Date();
  const sessionDate = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}-${today.getFullYear()}`;

  // Try the audio upload endpoint first
  try {
    const response = await FileSystem.uploadAsync(
      `${API_BASE}/upload-audio`,
      audioUri,
      {
        fieldName: "audio_file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: {
          session_id: sessionId,
          session_date: sessionDate,
        },
      },
    );

    if (response.status === 200) {
      return JSON.parse(response.body);
    }
  } catch {
    // endpoint might not exist yet — fall through
  }

  // Fallback: send a placeholder transcript
  return analyzeTranscript(
    "This is a placeholder transcript from the mobile recording.",
    sessionId,
    sessionDate,
  );
}

/**
 * Send an already-transcribed text to the backend for
 * rule-based + AI analysis.
 */
export async function analyzeTranscript(
  transcript: string,
  sessionId: string,
  sessionDate: string,
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze-transcript-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      session_id: sessionId,
      session_date: sessionDate,
    }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Health-check – useful to verify the backend is reachable.
 */
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}
