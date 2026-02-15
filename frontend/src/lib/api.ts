const FASTAPI_BASE = process.env.NEXT_PUBLIC_FASTAPI_URL || "https://treehacks-backend-pi.vercel.app";

// ---------- Session types ----------

export interface SessionEntry {
  transcript: string;
  analysis_result: {
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
      markers: Array<{
        category: string;
        marker: string;
        value: number;
        threshold: number;
        flagged: boolean;
        severity: string;
        evidence: string[];
      }>;
      raw_metrics: Record<string, number | string[]>;
    };
  };
  session_id: string;
  session_date: string;
  timestamp: string;
}

// ---------- Fetch functions ----------

export async function fetchLatestSession(): Promise<SessionEntry | null> {
  const res = await fetch(`${FASTAPI_BASE}/sessions/latest`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function fetchAllSessions(): Promise<SessionEntry[]> {
  const res = await fetch(`${FASTAPI_BASE}/sessions`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchWhoopSleep() {
  const res = await fetch(`${FASTAPI_BASE}/whoop/sleep/weekly`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWhoopRecovery() {
  const res = await fetch(`${FASTAPI_BASE}/whoop/recovery/weekly`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWhoopCycle() {
  const res = await fetch(`${FASTAPI_BASE}/whoop/cycle/weekly`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPreventativeCare(aiSummary: string) {
  const res = await fetch(`${FASTAPI_BASE}/preventative-care-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ai_summary: aiSummary }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function analyzeTranscript(
  transcript: string,
  sessionId: string = "",
  sessionDate: string = "",
) {
  const res = await fetch(`${FASTAPI_BASE}/analyze-transcript-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      session_id: sessionId,
      session_date: sessionDate,
    }),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}
