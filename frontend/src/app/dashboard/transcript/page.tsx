"use client";

import { useState } from "react";
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
} from "lucide-react";

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

const conversationList = [
  {
    id: 1,
    date: "Feb 14, 2026",
    time: "8:02 AM",
    duration: "12 min",
    markers: 5,
    sentiment: "Neutral",
    summary: "Morning check-in with medication reminder and stretches",
  },
  {
    id: 2,
    date: "Feb 13, 2026",
    time: "2:15 PM",
    duration: "8 min",
    markers: 1,
    sentiment: "Positive",
    summary: "Discussion about daughter's upcoming visit",
  },
  {
    id: 3,
    date: "Feb 13, 2026",
    time: "7:45 PM",
    duration: "5 min",
    markers: 0,
    sentiment: "Calm",
    summary: "Evening routine and sleep medication reminder",
  },
  {
    id: 4,
    date: "Feb 12, 2026",
    time: "9:00 AM",
    duration: "15 min",
    markers: 0,
    sentiment: "Joyful",
    summary: "Reminiscence therapy - Cape Cod vacation photos",
  },
  {
    id: 5,
    date: "Feb 12, 2026",
    time: "3:30 PM",
    duration: "6 min",
    markers: 3,
    sentiment: "Confused",
    summary: "Medication refill request, some confusion about insurance",
  },
];

const transcript: TranscriptEntry[] = [
  {
    id: 1,
    speaker: "assistant",
    text: "Good morning, Margaret! How are you feeling today?",
    timestamp: "8:02:00",
  },
  {
    id: 2,
    speaker: "user",
    text: "Oh, good morning! I slept pretty well. A little stiff this morning though.",
    timestamp: "8:02:15",
  },
  {
    id: 3,
    speaker: "assistant",
    text: "I'm glad you slept well! A little stiffness is normal. Would you like me to remind you about your morning stretches? Also, don't forget — you have your medication at 8:30.",
    timestamp: "8:02:22",
  },
  {
    id: 4,
    speaker: "user",
    text: "Oh yes, the stretches would be nice. And thank you for the reminder about my pills.",
    timestamp: "8:02:45",
  },
  {
    id: 5,
    speaker: "assistant",
    text: "Of course! Let's start with some gentle neck rolls. Turn your head slowly to the right... hold for 5 seconds... now slowly to the left. You're doing great!",
    timestamp: "8:03:00",
  },
  {
    id: 6,
    speaker: "user",
    text: "That feels good. Oh, when is... um... when is Sarah coming to visit?",
    timestamp: "8:04:12",
    markers: [
      {
        type: "warning",
        label: "word-finding difficulty",
        detail: "2.3s pause before 'Sarah'",
      },
    ],
  },
  {
    id: 7,
    speaker: "assistant",
    text: "Sarah is coming to visit on Saturday at 2:00 PM. That's in 2 days! She mentioned she'd bring the grandkids too.",
    timestamp: "8:04:20",
  },
  {
    id: 8,
    speaker: "user",
    text: "Oh wonderful! I need to... I need to get the... the thing... you know, the thing for the kids.",
    timestamp: "8:04:35",
    markers: [
      {
        type: "warning",
        label: "word-finding difficulty",
        detail: "4.1s pause, used 'thing' as placeholder (anomia)",
      },
    ],
  },
  {
    id: 9,
    speaker: "assistant",
    text: "Do you mean the cookies? You mentioned last time wanting to bake cookies for the grandkids!",
    timestamp: "8:04:48",
  },
  {
    id: 10,
    speaker: "user",
    text: "Yes! The cookies! That's exactly it. I always make them the chocolate chip ones.",
    timestamp: "8:05:02",
    markers: [
      {
        type: "success",
        label: "clear long-term memory",
        detail: "Recalled baking tradition and specific recipe preference",
      },
    ],
  },
  {
    id: 11,
    speaker: "user",
    text: "Oh, when is Sarah coming? Is it this weekend?",
    timestamp: "8:06:15",
    markers: [
      {
        type: "warning",
        label: "repeated question",
        detail: "2nd occurrence — previously asked at 8:04:12",
      },
    ],
  },
  {
    id: 12,
    speaker: "assistant",
    text: "Yes, Sarah is coming this Saturday at 2:00 PM — that's in just 2 days! And the grandkids are coming too. Perfect time for those chocolate chip cookies!",
    timestamp: "8:06:22",
  },
  {
    id: 13,
    speaker: "user",
    text: "When is Sarah visiting again?",
    timestamp: "8:08:30",
    markers: [
      {
        type: "warning",
        label: "repeated question",
        detail: "3rd occurrence — asked at 8:04:12, 8:06:15, 8:08:30",
      },
    ],
  },
  {
    id: 14,
    speaker: "assistant",
    text: "Sarah will be here on Saturday at 2:00 PM, just 2 days from now! I've added it to your calendar so you won't forget. Would you like me to set a reminder for Saturday morning?",
    timestamp: "8:08:38",
  },
];

const analysisSummary = {
  overall: "Moderate concern — showing increased short-term memory lapses and word-finding difficulties compared to previous sessions.",
  concerns: [
    "3 repeated questions about the same event within 4 minutes",
    "2 significant word-finding pauses (anomia indicators)",
    "Increased use of placeholder words ('thing', 'stuff')",
  ],
  positives: [
    "Long-term memory remains strong (recalled baking tradition)",
    "Emotional engagement is normal and appropriate",
    "Morning routine compliance is consistent",
    "Engaged positively with physical activity (stretches)",
  ],
};

export default function TranscriptPage() {
  const [selectedConversation, setSelectedConversation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime] = useState("8:02:00");

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
                    Feb 14, 2026 at 8:02 AM
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MessageCircle className="w-4 h-4" />
                    12 min duration
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700">
                    5 markers
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
                              : "CareCompanion"}
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
