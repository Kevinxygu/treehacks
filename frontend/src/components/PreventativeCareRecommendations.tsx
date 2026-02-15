"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
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

export const PreventativeCareRecommendations: React.FC<PreventativeCareRecommendationsProps> = () => {
  const [followed, setFollowed] = useState<Set<number>>(new Set());

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
        <div className="grid grid-cols-1 gap-4"> {/* Simplified to force single-column vertical stack */}
          {hardcodedRecommendations.map((rec, index) => {
            const isFollowed = followed.has(index);
            return (
              <Card
                key={index}
                className={`border-2 shadow-sm transition-colors ${
                  isFollowed ? 'border-green-500' : 'border-gray-200'
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
