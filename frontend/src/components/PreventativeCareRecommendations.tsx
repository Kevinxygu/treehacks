"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchPreventativeCare } from "@/lib/api";

interface PreventativeCareRecommendation {
  "Action title": string;
  "Action explanation": string;
  "Action reason": string;
  Time: string;
}

interface PreventativeCareRecommendationsProps {
  sessionResults?: { ai_summary?: string } | null;
}

export const PreventativeCareRecommendations: React.FC<PreventativeCareRecommendationsProps> = ({ sessionResults }) => {
  const [recommendations, setRecommendations] = useState<PreventativeCareRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const aiSummary = sessionResults?.ai_summary;
    if (!aiSummary) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPreventativeCare(aiSummary!);
        if (Array.isArray(data)) {
          setRecommendations(data);
        } else if (data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setError("Could not load recommendations.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionResults?.ai_summary]);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-care-purple" />
          <CardTitle className="text-lg">Preventative Care Recommendations</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Generating recommendations...</span>
          </div>
        )}
        {error && <p className="text-sm text-red-500 py-2">{error}</p>}
        {!loading && !error && recommendations.length === 0 && (
          <p className="text-sm text-gray-400 py-2">No recommendations available. Complete a session to generate recommendations.</p>
        )}
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((rec, index) => (
            <Card key={index} className="border-gray-200 shadow-sm">
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
