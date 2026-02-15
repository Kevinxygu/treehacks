"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Search,
  Filter,
  Volume2,
  Loader2,
  FileText,
} from "lucide-react";
import { fetchAllSessions, type SessionEntry } from "@/lib/api";

interface TranscriptEntry {
  id: number;
  speaker: "user" | "assistant";
  text: string;
  timestamp: string;
  markers?: Array<{
    type: "warning" | "success";
    label: string;
    detail: string;
  }>;
}

function parseTranscriptToEntries(transcript: string): TranscriptEntry[] {
  if (!transcript) return [];
  return transcript.split("\n").filter(Boolean).map((line, i) => {
    const isUser = line.startsWith("User:");
    const text = line.replace(/^(User|Assistant):\s*/, "");
    return {
      id: i + 1,
      speaker: isUser ? "user" : "assistant",
      text,
      timestamp: "",
    };
  });
}

export default function TranscriptPage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime] = useState("--:--:--");

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const data = await fetchAllSessions();
        setSessions(data.reverse()); // newest first
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setError(err instanceof Error ? err.message : "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading transcripts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Could not load transcripts</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <p className="text-sm text-gray-400">Ensure the backend is running on port 8000 and try again.</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Transcripts</h2>
        <p className="text-gray-500">Start a conversation on the mobile app to see transcripts here.</p>
      </div>
    );
  }

  const selectedSession = sessions[selectedConversation];
  const transcript = parseTranscriptToEntries(selectedSession?.transcript || "");
  const conversationList = sessions.map((s, i) => {
    const markerCount = s.analysis_result?.rule_based?.markers?.filter((m) => m.flagged).length ?? 0;
    return {
      id: i,
      date: s.session_date || new Date(s.timestamp).toLocaleDateString(),
      time: new Date(s.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      duration: `${s.analysis_result?.rule_based?.total_words ?? 0} words`,
      markers: markerCount,
      sentiment: markerCount === 0 ? "Normal" : "Flagged",
      summary: s.analysis_result?.rule_based_summary || "Session recorded",
    };
  });

  // Build analysis summary from selected session's AI data
  const analysisResult = selectedSession?.analysis_result;
  const flaggedMarkers = analysisResult?.rule_based?.markers?.filter((m) => m.flagged) || [];
  const normalMarkers = analysisResult?.rule_based?.markers?.filter((m) => !m.flagged) || [];
  const analysisSummary = {
    overall: analysisResult?.rule_based_summary || "No analysis available.",
    concerns: flaggedMarkers.map(
      (m) => `${m.marker.replace(/_/g, " ")}: ${m.evidence?.[0] || `value ${m.value} exceeds threshold ${m.threshold}`}`
    ),
    positives: normalMarkers.slice(0, 4).map(
      (m) => `${m.marker.replace(/_/g, " ")} within normal range (${m.value})`
    ),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Conversation Transcripts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review conversations with annotated cognitive markers
          </p>
        </div>
        <Button className="bg-[#5B9A8B] hover:bg-[#4A8577] text-white gap-2">
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Search className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-100">
                    <Filter className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-gray-50">
                {conversationList.map((conv, i) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(i)}
                    className={`w-full text-left px-5 py-3.5 transition-colors ${selectedConversation === i
                      ? "bg-[#5B9A8B]/5 border-l-2 border-[#5B9A8B]"
                      : "hover:bg-[#F8FAF9] border-l-2 border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {conv.date}
                      </span>
                      <span className="text-xs text-gray-400">
                        {conv.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {conv.summary}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {conv.duration}
                      </span>
                      {conv.markers > 0 && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0"
                        >
                          {conv.markers} marker{conv.markers !== 1 && "s"}
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0"
                      >
                        {conv.sentiment}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transcript + analysis */}
        <div className="lg:col-span-2 space-y-4">
          {/* Conversation metadata */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {conversationList[selectedConversation]?.date} at {conversationList[selectedConversation]?.time}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    {conversationList[selectedConversation]?.duration}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700">
                    {conversationList[selectedConversation]?.markers ?? 0} markers
                  </Badge>
                </div>
              </div>

              {/* Audio playback */}
              <div className="mt-4 p-3 rounded-xl bg-gray-50 flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-[#5B9A8B] flex items-center justify-center flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="w-full bg-[#E5EBE8] rounded-full h-1.5">
                    <div className="bg-[#5B9A8B] h-1.5 rounded-full" style={{ width: "35%" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{playbackTime}</span>
                    <span className="text-xs text-gray-400">8:14:00</span>
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transcript.map((entry) => (
                  <div key={entry.id} className="group">
                    <div
                      className={`flex gap-3 ${entry.markers && entry.markers.length > 0
                        ? "bg-amber-50/50 -mx-4 px-4 py-3 rounded-xl border border-amber-100/50"
                        : ""
                        }`}
                    >
                      {/* Speaker indicator */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${entry.speaker === "user"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-care-blue/15 text-care-blue"
                            }`}
                        >
                          {entry.speaker === "user" ? "MT" : "AI"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {entry.speaker === "user"
                              ? "Margaret"
                              : "Bloom"}
                          </span>
                          <span className="text-xs text-gray-300">
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {entry.text}
                        </p>

                        {/* Markers */}
                        {entry.markers?.map((marker, i) => (
                          <div
                            key={i}
                            className={`mt-2 flex items-start gap-2 text-xs ${marker.type === "warning"
                              ? "text-amber-600"
                              : "text-alert-green"
                              }`}
                          >
                            {marker.type === "warning" ? (
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            )}
                            <span>
                              <strong>[{marker.label}]</strong> {marker.detail}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis summary */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                {analysisSummary.overall}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Key Concerns
                  </h3>
                  <ul className="space-y-2">
                    {analysisSummary.concerns.map((concern, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-alert-green" />
                    Positive Indicators
                  </h3>
                  <ul className="space-y-2">
                    {analysisSummary.positives.map((positive, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-alert-green mt-1.5 flex-shrink-0" />
                        {positive}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                <Button variant="outline" className="gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Export as PDF
                </Button>
                <Button variant="outline" className="gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Export as CSV
                </Button>
                <span className="text-xs text-gray-400 ml-auto">
                  Share with Dr. Williams for the Feb 15 appointment
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
