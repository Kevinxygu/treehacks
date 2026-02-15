"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchPreventativeCare } from "@/lib/api";

interface PreventativeCareRecommendation {
  "Action title": string;
  "Action explanation": string;
  "Action reason": string;
  Time: string;
}

const BASELINE_RECOMMENDATIONS: PreventativeCareRecommendation[] = [
  {
    "Action title": "Stay physically active",
    "Action explanation": "Aim for at least 150 minutes of moderate activity per week (e.g. walking, swimming).",
    "Action reason": "Regular exercise supports heart health, mood, and cognitive function.",
    Time: new Date().toISOString(),
  },
  {
    "Action title": "Eat a balanced diet",
    "Action explanation": "Include plenty of vegetables, fruits, whole grains, and lean protein. Limit added sugars and processed foods.",
    "Action reason": "Good nutrition helps maintain energy, immunity, and long-term health.",
    Time: new Date().toISOString(),
  },
  {
    "Action title": "Get enough sleep",
    "Action explanation": "Aim for 7–9 hours of sleep per night and keep a consistent schedule.",
    "Action reason": "Sleep supports memory, mood, and overall well-being.",
    Time: new Date().toISOString(),
  },
  {
    "Action title": "Stay socially connected",
    "Action explanation": "Schedule regular calls or visits with family and friends.",
    "Action reason": "Social connection is linked to better mental and physical health.",
    Time: new Date().toISOString(),
  },
];

interface PreventativeCareRecommendationsProps {
  sessionResults?: { ai_summary?: string } | null;
}

export const PreventativeCareRecommendations: React.FC<PreventativeCareRecommendationsProps> = ({ sessionResults }) => {
  const [followed, setFollowed] = useState<Set<number>>(new Set());
  const [recommendations, setRecommendations] = useState<PreventativeCareRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingBaseline, setUsingBaseline] = useState(false);

  useEffect(() => {
    const aiSummary = sessionResults?.ai_summary;
    if (!aiSummary) {
      setRecommendations(BASELINE_RECOMMENDATIONS);
      setUsingBaseline(true);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setUsingBaseline(false);
    fetchPreventativeCare(aiSummary)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecommendations(data);
          setUsingBaseline(false);
        } else {
          setRecommendations(BASELINE_RECOMMENDATIONS);
          setUsingBaseline(true);
        }
      })
      .catch(() => {
        setRecommendations(BASELINE_RECOMMENDATIONS);
        setUsingBaseline(true);
        setError(null);
      })
      .finally(() => setLoading(false));
  }, [sessionResults?.ai_summary]);

  const toggleFollow = (index: number) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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
          <div className="flex items-center gap-2 py-6 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading recommendations...</span>
          </div>
        )}
        {usingBaseline && !loading && (
          <p className="py-2 text-sm text-gray-500">Showing general recommendations (personalized ones could not be loaded).</p>
        )}
        {error && (
          <p className="py-4 text-sm text-red-600">{error}</p>
        )}
        {!loading && !error && recommendations.length === 0 && (
          <p className="py-4 text-sm text-gray-500">No recommendations available.</p>
        )}
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((rec, index) => {
            const isFollowed = followed.has(index);
            return (
              <Card
                key={index}
                className={`border-2 shadow-sm transition-colors ${isFollowed ? 'border-green-500' : 'border-gray-200'
                  }`}
              >
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
                  <Button
                    variant={isFollowed ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => toggleFollow(index)}
                    className={isFollowed ? 'border-green-500 text-green-700' : ''}
                  >
                    {isFollowed ? 'Practicing' : 'Practice'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
