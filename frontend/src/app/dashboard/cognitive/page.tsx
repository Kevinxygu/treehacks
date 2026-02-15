"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  CheckCircle2,
  Download,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Shield,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { PreventativeCareRecommendations } from "@/components/PreventativeCareRecommendations";
import { fetchLatestSession } from "@/lib/api";

// --- Helpers ---

const MARKER_LABELS: Record<string, string> = {
  type_token_ratio: "Type-Token Ratio",
  hedge_phrase_rate: "Hedge Phrase Rate",
  filler_word_rate: "Filler Word Rate",
  pronoun_ratio: "Pronoun Ratio",
  generic_pronoun_ratio: "Generic Pronoun Ratio",
  pause_rate: "Pause Rate",
  within_session_repetitions: "Repetitions",
};

const CATEGORY_LABELS: Record<string, string> = {
  lexical_diversity: "Lexical Diversity",
  anomia: "Anomia (Word-Finding)",
  disfluency: "Disfluency",
  pronoun_usage: "Pronoun Usage",
  pause_patterns: "Pause Patterns",
  repetition: "Repetition",
};

const CATEGORY_ICONS: Record<string, typeof Brain> = {
  lexical_diversity: BarChart3,
  anomia: FileText,
  disfluency: Activity,
  pronoun_usage: FileText,
  pause_patterns: Activity,
  repetition: TrendingUp,
};

// For type_token_ratio, higher is better (above threshold = good)
// For all other markers, lower is better (below threshold = good)
const HIGHER_IS_BETTER = new Set(["type_token_ratio"]);

function getSeverityColor(severity: string, flagged: boolean) {
  if (!flagged) return { bg: "bg-alert-green/10", text: "text-alert-green", border: "border-alert-green/20" };
  switch (severity) {
    case "mild":
      return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" };
    case "moderate":
      return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" };
    case "severe":
      return { bg: "bg-red-50", text: "text-alert-red", border: "border-red-200" };
    default:
      return { bg: "bg-alert-green/10", text: "text-alert-green", border: "border-alert-green/20" };
  }
}

function getRiskColor(score: number) {
  if (score <= 20) return { label: "Low Risk", color: "text-alert-green", bg: "bg-alert-green/10", ring: "ring-alert-green/20" };
  if (score <= 50) return { label: "Moderate Risk", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" };
  if (score <= 75) return { label: "High Risk", color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" };
  return { label: "Critical", color: "text-alert-red", bg: "bg-red-50", ring: "ring-red-200" };
}

function formatMarkerValue(marker: string, value: number): string {
  if (marker === "within_session_repetitions") return String(value);
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function getProgressPercent(marker: string, value: number, threshold: number): number {
  if (HIGHER_IS_BETTER.has(marker)) {
    // For higher-is-better, show value relative to a max of threshold * 2
    return Math.min((value / (threshold * 2)) * 100, 100);
  }
  // For lower-is-better, show how close to threshold
  if (threshold === 0) return 0;
  return Math.min((value / threshold) * 100, 100);
}

function getProgressColor(marker: string, value: number, threshold: number, flagged: boolean): string {
  if (flagged) return "bg-[#E8C87B]";
  if (HIGHER_IS_BETTER.has(marker)) {
    return value >= threshold ? "bg-[#7EC8B8]" : "bg-[#E8C87B]";
  }
  return value <= threshold ? "bg-[#7EC8B8]" : "bg-[#E8C87B]";
}

// --- Raw Metrics Formatting ---

const RAW_METRIC_GROUPS: { label: string; metrics: { key: string; label: string; format?: (v: number) => string }[] }[] = [
  {
    label: "Vocabulary",
    metrics: [
      { key: "total_words", label: "Total Words" },
      { key: "unique_words", label: "Unique Words" },
      { key: "ttr", label: "Type-Token Ratio", format: (v) => v.toFixed(4) },
      { key: "mattr", label: "Moving Avg TTR", format: (v) => v.toFixed(4) },
      { key: "hapax_legomena", label: "Hapax Legomena" },
      { key: "hapax_ratio", label: "Hapax Ratio", format: (v) => v.toFixed(2) },
    ],
  },
  {
    label: "Fluency",
    metrics: [
      { key: "filler_count", label: "Filler Words" },
      { key: "filler_rate", label: "Filler Rate", format: (v) => v.toFixed(4) },
      { key: "false_starts", label: "False Starts" },
      { key: "immediate_word_repetitions", label: "Immediate Repetitions" },
      { key: "total_disfluencies", label: "Total Disfluencies" },
    ],
  },
  {
    label: "Word-Finding",
    metrics: [
      { key: "hedge_phrase_count", label: "Hedge Phrases" },
      { key: "hedge_phrase_rate", label: "Hedge Rate", format: (v) => v.toFixed(4) },
      { key: "trailing_sentences", label: "Trailing Sentences" },
      { key: "anomia_indicators", label: "Anomia Indicators" },
    ],
  },
  {
    label: "Pronouns",
    metrics: [
      { key: "pronoun_count", label: "Pronoun Count" },
      { key: "pronoun_ratio", label: "Pronoun Ratio", format: (v) => v.toFixed(4) },
      { key: "generic_pronoun_count", label: "Generic Pronouns" },
      { key: "generic_pronoun_ratio", label: "Generic Pronoun Ratio", format: (v) => v.toFixed(4) },
    ],
  },
  {
    label: "Patterns",
    metrics: [
      { key: "pause_count", label: "Pause Count" },
      { key: "pause_rate", label: "Pause Rate", format: (v) => v.toFixed(4) },
      { key: "within_session_repetitions", label: "Repetitions" },
    ],
  },
];

// --- Component ---

export default function CognitiveAnalysisPage() {
  const [showRawMetrics, setShowRawMetrics] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchLatestSession();
        if (session?.analysis_result) {
          setSessionResults(session.analysis_result);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
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
        <span className="ml-3 text-gray-500">Loading analysis...</span>
      </div>
    );
  }

  if (!sessionResults) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Available</h2>
        <p className="text-gray-500">Start a conversation on the mobile app to generate a cognitive analysis.</p>
      </div>
    );
  }

  const data = sessionResults;
  const risk = getRiskColor(data.risk_score);
  const flaggedCount = data.rule_based.markers.filter((m: any) => m.flagged).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cognitive Health Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Session {data.session_id} &middot; {data.session_date} &middot; Rule-based speech analysis with AI insights
          </p>
        </div>
        <Button className="bg-[#5B9A8B] hover:bg-[#4A8577] text-white gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Top summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Score */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${risk.bg} ring-1 ${risk.ring} flex items-center justify-center`}>
                <Shield className={`w-7 h-7 ${risk.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Risk Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.risk_score}
                  <span className="text-sm text-gray-400 font-normal">/100</span>
                </p>
                <Badge className={`mt-1 ${risk.bg} ${risk.color} border-0`}>
                  {risk.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5B9A8B]/10 ring-1 ring-[#5B9A8B]/20 flex items-center justify-center">
                <Brain className="w-7 h-7 text-[#5B9A8B]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Session Stats</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{data.rule_based.total_words}</span>
                    <span className="text-xs text-gray-400 ml-1">words</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{data.rule_based.unique_words}</span>
                    <span className="text-xs text-gray-400 ml-1">unique</span>
                  </div>
                  <div className="w-px h-6 bg-gray-200" />
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{data.rule_based.total_sentences}</span>
                    <span className="text-xs text-gray-400 ml-1">sent.</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Markers Summary */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-alert-green/10 ring-1 ring-alert-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-alert-green" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Markers Status</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.rule_based.markers.length - flaggedCount}
                  <span className="text-sm text-gray-400 font-normal">/{data.rule_based.markers.length} passed</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {flaggedCount === 0
                    ? "All markers within healthy range"
                    : `${flaggedCount} marker${flaggedCount > 1 ? "s" : ""} flagged`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rule-based Summary */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="py-4 px-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-alert-green" />
            <p className="text-sm text-gray-700 font-medium">{data.rule_based_summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Research Metrics (Markers) */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Research Metrics</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Individual cognitive markers measured against clinical thresholds
              </p>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              {data.rule_based.markers.length} markers
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rule_based.markers.map((marker: any, i: number) => {
              const severity = getSeverityColor(marker.severity, marker.flagged);
              const Icon = CATEGORY_ICONS[marker.category] || Brain;
              const progressPct = getProgressPercent(marker.marker, marker.value, marker.threshold);
              const progressColor = getProgressColor(marker.marker, marker.value, marker.threshold, marker.flagged);
              const isHigherBetter = HIGHER_IS_BETTER.has(marker.marker);

              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${severity.border} ${severity.bg}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${severity.text}`} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {MARKER_LABELS[marker.marker] || marker.marker}
                        </p>
                        <p className="text-xs text-gray-400">
                          {CATEGORY_LABELS[marker.category] || marker.category}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs border-0 ${severity.bg} ${severity.text}`}>
                      {marker.flagged ? marker.severity : "normal"}
                    </Badge>
                  </div>

                  {/* Value vs Threshold */}
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatMarkerValue(marker.marker, marker.value)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        Threshold: {marker.threshold}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isHigherBetter ? "Higher is better" : "Lower is better"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Threshold marker line */}
                  <div className="relative mt-0.5">
                    <div
                      className="absolute top-0 w-px h-2 bg-gray-400"
                      style={{
                        left: isHigherBetter
                          ? `${Math.min((marker.threshold / (marker.threshold * 2)) * 100, 100)}%`
                          : "100%",
                      }}
                    />
                  </div>

                  {/* Evidence */}
                  {marker.evidence.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200/50">
                      {marker.evidence.map((ev: string, j: number) => (
                        <p key={j} className="text-xs text-gray-500 italic">
                          {ev}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Raw Metrics (collapsible) */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowRawMetrics(!showRawMetrics)}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Raw Metrics</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Complete numerical data from the analysis engine
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              {showRawMetrics ? (
                <>
                  Hide <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {showRawMetrics && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RAW_METRIC_GROUPS.map((group) => (
                <div key={group.label}>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {group.label}
                  </h4>
                  <div className="space-y-2">
                    {group.metrics.map((metric) => {
                      const raw = data.rule_based.raw_metrics as Record<string, number | string[]>;
                      const val = raw[metric.key];
                      if (val === undefined) return null;
                      const displayVal =
                        metric.format && typeof val === "number"
                          ? metric.format(val)
                          : String(val);
                      return (
                        <div
                          key={metric.key}
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                        >
                          <span className="text-sm text-gray-600">
                            {metric.label}
                          </span>
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {displayVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <PreventativeCareRecommendations sessionResults={sessionResults} />

      {/* AI Summary */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-care-purple" />
              <CardTitle className="text-lg">AI-Generated Report</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-gray-500"
              onClick={() => setShowFullReport(!showFullReport)}
            >
              {showFullReport ? (
                <>
                  Collapse <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Expand <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`prose prose-sm prose-gray max-w-none ${showFullReport ? "" : "max-h-64 overflow-hidden relative"
              }`}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-gray-700 mt-4 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1 mb-3 ml-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-care-blue mt-2 flex-shrink-0" />
                    <span>{children}</span>
                  </li>
                ),
                hr: () => <Separator className="my-4" />,
              }}
            >
              {data.ai_summary}
            </ReactMarkdown>
            {!showFullReport && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* JSON Data (collapsible) */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader
          className="cursor-pointer"
          onClick={() => {
            const el = document.getElementById("json-section");
            if (el) el.classList.toggle("hidden");
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Session JSON Data</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Complete session data in JSON format
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-gray-500">
              Toggle <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div id="json-section" className="hidden">
            <pre className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-xs text-gray-700 font-mono leading-relaxed border border-gray-100">
              {JSON.stringify(sessionResults, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
