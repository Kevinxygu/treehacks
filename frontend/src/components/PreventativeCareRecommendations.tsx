
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PreventativeCareRecommendation {
  "Action title": string;
  "Action explanation": string;
  "Action reason": string;
  Time: string;
}

// Hardcoded recommendations data
const hardcodedRecommendations: PreventativeCareRecommendation[] = [
  {
    "Action title": "General Cognitive Workout: Verb Network Strengthening (VNeST)",
    "Action explanation": "You will be given a high-level verb such as 'Synthesize.' Provide three distinct Agent-Patient pairs (who performs the action and what is acted upon), then expand one pair into a full sentence specifying When, Where, and Why. This exercise strengthens the verb-argument network that underpins flexible, precise language production.",
    "Action reason": "Triage classified this session as Case B (Baseline Performance). Speech was fluid, lexically diverse (TTR 0.696), and cognitively dense with zero filler words, zero hedge phrases, and minimal pronoun reliance. A two-task General Cognitive Workout is prescribed to maintain high-level executive function and semantic retrieval speed.",
    "Time": "2026-02-14 20:31:25"
  },
  {
    "Action title": "General Cognitive Workout: Semantic Feature Analysis (SFA)",
    "Action explanation": "You will be presented with a moderately complex object. Your task is to generate its Group (category), Use (function), Action (what it does or what you do with it), Properties (physical and abstract attributes), Location (where it is typically found), and Association (a related concept or memory). Aim for precise, technical descriptors rather than general terms.",
    "Action reason": "With all cognitive-linguistic markers in the normal range and a risk score of only 3.3 out of 100, the full three-task rehabilitative protocol is not warranted. However, maintaining robust semantic networks is critical for long-term cognitive reserve. SFA challenges detailed feature retrieval and categorical reasoning, complementing the verb-focused demands of VNeST to provide a well-rounded executive-function workout.",
    "Time": "2026-02-14 20:31:25"
  }
];

interface PreventativeCareRecommendationsProps {
  sessionResults?: unknown;
}

export const PreventativeCareRecommendations: React.FC<PreventativeCareRecommendationsProps> = () => {
  // sessionResults is not directly used in this hardcoded version, but can be passed for context if needed.

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-care-purple" />
          <CardTitle className="text-lg">Preventative Care Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4"> {/* Simplified to force single-column vertical stack */}
          {hardcodedRecommendations.map((rec, index) => (
            <Card key={index} className="border-gray-200 shadow-sm"> {/* Card styling remains */}
              <CardHeader>
                <CardTitle className="text-md font-semibold">{rec["Action title"]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Explanation:</p>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown>
                      {rec["Action explanation"]}
                    </ReactMarkdown>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Reason:</p>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown>
                      {rec["Action reason"]}
                    </ReactMarkdown>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Time: {new Date(rec.Time).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
