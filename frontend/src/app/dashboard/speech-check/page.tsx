"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, AlertCircle, MessageSquare, TrendingDown } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface DiagnosisSegment {
  text: string;
  sentiment: string;
  sentimentScore: number;
}

interface SpeechDiagnosis {
  transcript: string;
  overallSentiment: "positive" | "negative" | "neutral";
  overallSentimentScore: number;
  soundingLow: boolean;
  summary: string;
  segments: DiagnosisSegment[];
}

export default function SpeechCheckPage() {
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<SpeechDiagnosis | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setDiagnosis(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      setRecording(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    setRecording(false);
    setAnalyzing(true);
    setError(null);

    const mimeType = recorder.mimeType || "audio/webm";

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      try {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) {
          setError("No audio captured. Record for at least a few seconds and try again.");
          setAnalyzing(false);
          return;
        }

        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        const res = await fetch(`${API_BASE}/api/speech-diagnosis`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${res.status}`);
        }

        const data: SpeechDiagnosis = await res.json();
        setDiagnosis(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setDiagnosis(null);
      } finally {
        setAnalyzing(false);
      }
    };

    recorder.stop();
  }, []);

  const sentimentColor = (s: string) => {
    if (s === "positive") return "bg-alert-green/15 text-alert-green border-alert-green/30";
    if (s === "negative") return "bg-alert-red/15 text-alert-red border-alert-red/30";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Speech check</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record a short sample to get a quick read on tone: confidence, sentiment, and whether they sound low.
        </p>
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#5B9A8B]" />
            Record
          </CardTitle>
          <p className="text-sm text-gray-500">
            Allow microphone access, then speak for 10–30 seconds. We’ll analyze sentiment and tone.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error && (
            <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!diagnosis && !analyzing && (
            <Button
              size="lg"
              onClick={recording ? stopRecording : startRecording}
              className={
                recording
                  ? "bg-alert-red hover:bg-alert-red/90 text-white gap-2"
                  : "bg-[#5B9A8B] hover:bg-[#4A8577] text-white gap-2"
              }
            >
              {recording ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop & analyze
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start recording
                </>
              )}
            </Button>
          )}

          {recording && (
            <p className="text-sm text-amber-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording… Click “Stop & analyze” when done.
            </p>
          )}

          {analyzing && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing speech…
            </div>
          )}
        </CardContent>
      </Card>

      {diagnosis && (
        <>
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#5B9A8B]" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={sentimentColor(diagnosis.overallSentiment)}>
                  {diagnosis.overallSentiment}
                </Badge>
                <span className="text-sm text-gray-500">
                  Score: {diagnosis.overallSentimentScore.toFixed(2)} (range -1 to 1)
                </span>
                {diagnosis.soundingLow && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                    <TrendingDown className="w-3 h-3" />
                    May sound low
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-700">{diagnosis.summary}</p>
            </CardContent>
          </Card>

          {diagnosis.transcript && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{diagnosis.transcript}</p>
              </CardContent>
            </Card>
          )}

          {diagnosis.segments && diagnosis.segments.length > 0 && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">By segment</CardTitle>
                <p className="text-sm text-gray-500">Sentiment over time</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {diagnosis.segments.map((seg, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                    >
                      <Badge className={sentimentColor(seg.sentiment) + " flex-shrink-0"}>
                        {seg.sentiment}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800">{seg.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Score: {seg.sentimentScore.toFixed(2)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setDiagnosis(null);
                setError(null);
              }}
              className="gap-2"
            >
              <Mic className="w-4 h-4" />
              Record again
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
