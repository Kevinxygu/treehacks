"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Footprints,
  Pill,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Calendar,
  Battery,
  Activity,
  X,
  Loader2,
  Moon,
  Zap,
  FileText,
  RefreshCw
} from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const WORKFLOWS_URL =
  process.env.NEXT_PUBLIC_WORKFLOWS_URL || "http://localhost:3000";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchAllSessions,
  fetchWhoopRecovery,
  fetchWhoopSleep,
  fetchWhoopCycle,
  fetchLatestSession,
  type SessionEntry,
} from "@/lib/api";

function getWhoopColor(val: number) {
  if (val >= 65) return "#7EC8B8";
  if (val >= 35) return "#E8C87B";
  return "#D97B7B";
}

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  icon: Icon,
  theme = "default"
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  icon: React.ElementType;
  theme?: "default" | "overlay";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = getWhoopColor(value);
  const isOverlay = theme === "overlay";
  const trackStroke = isOverlay ? "rgba(255,255,255,0.25)" : "#F5F7F6";
  const textClass = isOverlay ? "text-white" : "text-[#2D3B36]";
  const labelClass = isOverlay ? "text-white font-semibold" : "text-sm font-semibold text-[#6B7C74]";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackStroke}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease"
            }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-1 opacity-50" style={{ color }} />
          <span className={`text-2xl font-bold ${textClass}`}>{value}%</span>
        </div>
      </div>
      <span className={`text-sm ${labelClass}`}>{label}</span>
    </div>
  );
}

// Placeholder data for metrics without backend endpoints
const activityData = [
  { day: "Mon", steps: 3200 },
  { day: "Tue", steps: 4100 },
  { day: "Wed", steps: 2800 },
  { day: "Thu", steps: 3600 },
  { day: "Fri", steps: 4500 },
  { day: "Sat", steps: 2100 },
  { day: "Sun", steps: 3400 },
];

const upcomingEvents = [
  {
    title: "Dr. Williams Appointment",
    date: "Tomorrow, 10:00 AM",
    type: "medical",
  },
  {
    title: "Sarah's Visit",
    date: "Saturday, 2:00 PM",
    type: "family",
  },
  {
    title: "Medication Delivery",
    date: "Thursday, 2:00 PM",
    type: "medication",
  },
];


function MetricCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  value: string;
  unit?: string;
  trend: "up" | "down" | "stable";
  trendValue: string;
  icon: React.ElementType;
  color: string;
  children?: React.ReactNode;
}) {
  const trendColors = {
    up: "text-[#7EC8B8]",
    down: "text-[#D97B7B]",
    stable: "text-[#6B7C74]",
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-sm font-medium text-gray-500">{title}</span>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {trendValue}
          </div>
        </div>

        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-3xl font-bold text-[#2D3B36]">{value}</span>
          {unit && <span className="text-lg text-[#9CA8A2]">{unit}</span>}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const searchParams = useSearchParams();
  const [whoopConnected, setWhoopConnected] = useState<boolean | null>(null);
  const [whoopLoading, setWhoopLoading] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/whoop/status`)
      .then((r) => r.json())
      .then((d) => setWhoopConnected(d.connected))
      .catch(() => setWhoopConnected(false));
  }, [searchParams.get("whoop")]);

  const connectWhoop = async () => {
    setWhoopLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/whoop/auth-url`);
      const { authUrl } = await res.json();
      if (authUrl) window.location.href = authUrl;
    } finally {
      setWhoopLoading(false);
    }
  };

  const [syncLoading, setSyncLoading] = useState(false);
  const [whoopData, setWhoopData] = useState({
    sleep: 0,
    sleepConsistency: undefined as number | undefined,
    sleepEfficiency: undefined as number | undefined,
    recovery: 0,
    recoveryRestingHeartRate: undefined as number | undefined,
    recoveryHrvRmssdMilli: undefined as number | undefined,
    recoverySpo2Percentage: undefined as number | undefined,
    strainPercent: 0,
    strainKilojoule: undefined as number | undefined,
    strainAverageHeartRate: undefined as number | undefined,
    strainMaxHeartRate: undefined as number | undefined,
  });
  const [latestSession, setLatestSession] = useState<SessionEntry | null>(null);
  const [allSessions, setAllSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Whoop weekly data for overlay charts
  const [sleepOverlayBarData, setSleepOverlayBarData] = useState<{ day: string; score: number }[]>([]);
  const [recoveryOverlayBarData, setRecoveryOverlayBarData] = useState<{ day: string; score: number }[]>([]);
  const [strainOverlayBarData, setStrainOverlayBarData] = useState<{ day: string; strain: number }[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLatestSession(),
      fetchAllSessions(),
    ]).then(([latest, sessions]) => {
      setLatestSession(latest);
      setAllSessions(sessions);
    }).finally(() => setLoading(false));
  }, []);

  // Fetch whoop weekly data for overlays on mount
  useEffect(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    fetchWhoopSleep().then((d) => {
      if (d?.records?.length) {
        setSleepOverlayBarData(d.records.slice(0, 7).map((r: any, i: number) => ({
          day: r.start ? days[new Date(r.start).getDay()] : `D${i + 1}`,
          score: Math.round(r.score?.sleep_performance_percentage ?? 0),
        })));
      }
    }).catch(() => { });
    fetchWhoopRecovery().then((d) => {
      if (d?.records?.length) {
        setRecoveryOverlayBarData(d.records.slice(0, 7).map((r: any, i: number) => ({
          day: r.created_at ? days[new Date(r.created_at).getDay()] : `D${i + 1}`,
          score: Math.round(r.score?.recovery_score ?? 0),
        })));
      }
    }).catch(() => { });
    fetchWhoopCycle().then((d) => {
      if (d?.records?.length) {
        setStrainOverlayBarData(d.records.slice(0, 7).map((r: any, i: number) => ({
          day: r.start ? days[new Date(r.start).getDay()] : `D${i + 1}`,
          strain: r.score?.strain ?? 0,
        })));
      }
    }).catch(() => { });
  }, []);

  const [expandedWhoop, setExpandedWhoop] = useState<"sleep" | "recovery" | "strain" | null>(null);
  const [backdropReveal, setBackdropReveal] = useState(false);
  const [overlayReveal, setOverlayReveal] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (expandedWhoop !== null) {
      const id = requestAnimationFrame(() => {
        setBackdropReveal(true);
        setOverlayReveal(true);
      });
      return () => cancelAnimationFrame(id);
    }
    setBackdropReveal(false);
    setOverlayReveal(false);
  }, [expandedWhoop]);

  const closeWhoopOverlay = () => {
    if (expandedWhoop === null) return;
    setBackdropReveal(false);
    setOverlayReveal(false);
    closeTimeoutRef.current = setTimeout(() => {
      setExpandedWhoop(null);
      closeTimeoutRef.current = null;
    }, 300);
  };

  const whoopOrder: Array<"sleep" | "recovery" | "strain"> = ["sleep", "recovery", "strain"];
  const goToPrevOverlay = () => {
    if (expandedWhoop === null) return;
    setOverlayReveal(false);
    arrowTimeoutRef.current = setTimeout(() => {
      const i = whoopOrder.indexOf(expandedWhoop);
      setExpandedWhoop(whoopOrder[(i - 1 + 3) % 3]);
      arrowTimeoutRef.current = null;
    }, 300);
  };
  const goToNextOverlay = () => {
    if (expandedWhoop === null) return;
    setOverlayReveal(false);
    arrowTimeoutRef.current = setTimeout(() => {
      const i = whoopOrder.indexOf(expandedWhoop);
      setExpandedWhoop(whoopOrder[(i + 1) % 3]);
      arrowTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (arrowTimeoutRef.current) clearTimeout(arrowTimeoutRef.current);
    };
  }, []);

  const syncWhoop = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch(`${WORKFLOWS_URL}/api/sync-health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elderId: "margaret" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const scores = data?.scores;
      if (scores) {
        const num = (v: unknown) => (typeof v === "number" && !Number.isNaN(v) ? v : undefined);
        setWhoopData((prev) => ({
          sleep: num(scores.sleep) ?? prev.sleep,
          sleepConsistency: num(scores.sleepConsistency) ?? prev.sleepConsistency,
          sleepEfficiency: num(scores.sleepEfficiency) ?? prev.sleepEfficiency,
          recovery: num(scores.recovery) ?? prev.recovery,
          recoveryRestingHeartRate: num(scores.recoveryRestingHeartRate) ?? prev.recoveryRestingHeartRate,
          recoveryHrvRmssdMilli: num(scores.recoveryHrvRmssdMilli) ?? prev.recoveryHrvRmssdMilli,
          recoverySpo2Percentage: num(scores.recoverySpo2Percentage) ?? prev.recoverySpo2Percentage,
          strainPercent: num(scores.strainPercent) ?? prev.strainPercent,
          strainKilojoule: num(scores.strainKilojoule) ?? prev.strainKilojoule,
          strainAverageHeartRate: num(scores.strainAverageHeartRate) ?? prev.strainAverageHeartRate,
          strainMaxHeartRate: num(scores.strainMaxHeartRate) ?? prev.strainMaxHeartRate,
        }));
      }
    } finally {
      setSyncLoading(false);
    }
  };

  // Derive cognitive chart data from sessions
  const cognitiveData = allSessions.map((s, i) => ({
    day: s.session_date || `S${i + 1}`,
    score: Math.round(100 - (s.analysis_result?.risk_score ?? 0)),
  }));

  // Derive alerts from latest session
  const alerts: { title: string; description: string; level: string; time: string }[] = [];
  if (latestSession?.analysis_result?.rule_based?.markers) {
    const flagged = latestSession.analysis_result.rule_based.markers.filter((m) => m.flagged);
    flagged.forEach((m) => {
      alerts.push({
        level: m.severity === "severe" ? "critical" : "warning",
        title: `Flagged: ${m.marker.replace(/_/g, " ")}`,
        description: m.evidence?.[0] || `Value: ${m.value} (threshold: ${m.threshold})`,
        time: latestSession.timestamp ? new Date(latestSession.timestamp).toLocaleTimeString() : "Recent",
      });
    });
  }
  if (alerts.length === 0 && latestSession) {
    alerts.push({
      level: "success",
      title: "All markers normal",
      description: latestSession.analysis_result?.rule_based_summary || "No concerns detected",
      time: latestSession.timestamp ? new Date(latestSession.timestamp).toLocaleTimeString() : "Recent",
    });
  }

  // Derive recent conversations from sessions
  const recentConversations = allSessions.slice().reverse().slice(0, 5).map((s, i) => {
    const markerCount = s.analysis_result?.rule_based?.markers?.filter((m) => m.flagged).length ?? 0;
    return {
      id: String(i + 1),
      time: s.session_date || new Date(s.timestamp).toLocaleString(),
      duration: `${s.analysis_result?.rule_based?.total_words ?? 0} words`,
      markers: markerCount,
      summary: s.analysis_result?.rule_based_summary || "Session recorded",
    };
  });

  // Latest cognitive score
  const latestCogScore = latestSession
    ? Math.round(100 - (latestSession.analysis_result?.risk_score ?? 0))
    : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto space-y-6">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
        {whoopConnected === null ? (
          <>
            <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse shrink-0" />
            <span className="text-xs text-gray-500">Whoop</span>
          </>
        ) : whoopConnected ? (
          <>
            <div
              className="w-3 h-3 rounded-full bg-alert-green shrink-0"
              style={{
                boxShadow: "0 0 8px 2px rgba(126, 200, 184, 0.8), 0 0 16px 4px rgba(126, 200, 184, 0.4)",
              }}
            />
            <span className="text-xs text-gray-500">Whoop</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={syncWhoop}
              disabled={syncLoading}
              className="h-7 px-2 text-xs gap-1 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw
                className={`w-3 h-3 ${syncLoading ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
          </>
        ) : (
          <button
            onClick={connectWhoop}
            disabled={whoopLoading}
            className="flex items-center gap-2"
            title="Connect WHOOP"
          >
            <div
              className="w-3 h-3 rounded-full bg-alert-red shrink-0"
              style={{
                boxShadow: "0 0 8px 2px rgba(217, 123, 123, 0.8), 0 0 16px 4px rgba(217, 123, 123, 0.4)",
              }}
            />
            <span className="text-xs text-gray-500 hover:text-gray-700">
              Whoop
            </span>
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Whoop Data Section - Front and Center */}
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white font-black text-xs">W</span>
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Whoop Health Insights</CardTitle>
                <p className="text-xs text-gray-400">Real-time biometrics from wearable service</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <button
                type="button"
                onClick={() => setExpandedWhoop("sleep")}
                className="flex flex-col items-center gap-3 outline-none focus:ring-2 focus:ring-[#7EC8B8] focus:ring-offset-2 rounded-2xl"
              >
                <CircularProgress
                  value={whoopData.sleep}
                  label="Sleep Performance"
                  icon={Moon}
                />
              </button>
              <button
                type="button"
                onClick={() => setExpandedWhoop("recovery")}
                className="flex flex-col items-center gap-3 outline-none focus:ring-2 focus:ring-[#7EC8B8] focus:ring-offset-2 rounded-2xl"
              >
                <CircularProgress
                  value={whoopData.recovery}
                  label="Recovery"
                  icon={Battery}
                />
              </button>
              <button
                type="button"
                onClick={() => setExpandedWhoop("strain")}
                className="flex flex-col items-center gap-3 outline-none focus:ring-2 focus:ring-[#7EC8B8] focus:ring-offset-2 rounded-2xl"
              >
                <CircularProgress
                  value={whoopData.strainPercent}
                  label="Strain"
                  icon={Zap}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {expandedWhoop !== null && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/65 transition-opacity duration-300 ${backdropReveal ? "opacity-100" : "opacity-0"}`}
            onClick={closeWhoopOverlay}
            role="dialog"
            aria-modal="true"
            aria-label={`${expandedWhoop} details`}
          >
            <button
              type="button"
              onClick={closeWhoopOverlay}
              className="absolute top-4 right-4 z-10 p-2 rounded-full text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="flex items-center justify-center gap-4 w-full max-w-5xl px-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={goToPrevOverlay}
                className="shrink-0 p-3 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <div className="flex flex-col items-center gap-10 flex-1 max-w-4xl">
                {expandedWhoop === "sleep" && (
                  <>
                    <div className="flex items-center justify-center gap-16">
                      <div
                        className="shrink-0 transition-opacity duration-500 ease-out"
                        style={{
                          opacity: overlayReveal ? 1 : 0,
                          transitionDelay: "0ms"
                        }}
                      >
                        <CircularProgress
                          value={whoopData.sleep}
                          size={200}
                          strokeWidth={14}
                          label="Sleep Performance"
                          icon={Moon}
                          theme="overlay"
                        />
                      </div>
                      <div
                        className="flex flex-col gap-6 min-w-[280px] transition-opacity duration-500 ease-out"
                        style={{
                          opacity: overlayReveal ? 1 : 0,
                          transitionDelay: "150ms"
                        }}
                      >
                        {[
                          { label: "Sleep amount vs. needed", value: whoopData.sleep },
                          { label: "Sleep consistency", value: whoopData.sleepConsistency ?? 0 },
                          { label: "Sleep efficiency", value: whoopData.sleepEfficiency ?? 0 },
                        ].map(({ label, value }) => {
                          const pct = Math.round(Number(value));
                          const color = getWhoopColor(pct);
                          return (
                            <div key={label} className="flex flex-col gap-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-white">{label}</span>
                                <span className="text-sm font-semibold text-white">{pct}%</span>
                              </div>
                              <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="w-full max-w-2xl h-48 p-4 transition-opacity duration-500 ease-out"
                      style={{
                        opacity: overlayReveal ? 1 : 0,
                        transitionDelay: "300ms"
                      }}
                    >
                      <p className="text-sm font-semibold text-white mb-3">Sleep performance (7 days)</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={sleepOverlayBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={{ stroke: "rgba(255,255,255,0.3)" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={false} tickLine={false} width={28} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {sleepOverlayBarData.map((entry, index) => (
                              <Cell key={index} fill={getWhoopColor(entry.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
                {expandedWhoop === "recovery" && (
                  <>
                    <div className="flex items-center justify-center gap-16">
                      <div
                        className="shrink-0 transition-opacity duration-500 ease-out"
                        style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "0ms" }}
                      >
                        <CircularProgress
                          value={whoopData.recovery}
                          size={200}
                          strokeWidth={14}
                          label="Recovery"
                          icon={Battery}
                          theme="overlay"
                        />
                      </div>
                      <div
                        className="flex flex-col gap-6 min-w-[280px] transition-opacity duration-500 ease-out"
                        style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "150ms" }}
                      >
                        {[
                          { label: "Resting heart rate", value: whoopData.recoveryRestingHeartRate ?? 0, max: 120, invert: true },
                          { label: "Heart rate variability", value: whoopData.recoveryHrvRmssdMilli ?? 0, max: 100, invert: false },
                          { label: "Respiratory frequency", value: whoopData.recoverySpo2Percentage ?? 0, max: 100, invert: false },
                        ].map(({ label, value, max, invert }) => {
                          const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
                          const colorPct = invert ? 100 - pct : pct;
                          const color = getWhoopColor(colorPct);
                          const display = label === "Heart rate variability" ? `${Number(value).toFixed(1)} ms` : label === "Resting heart rate" ? `${Math.round(value)} bpm` : `${Math.round(value)}%`;
                          return (
                            <div key={label} className="flex flex-col gap-2">
                              <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-white">{label}</span>
                                <span className="text-sm font-semibold text-white">{display}</span>
                              </div>
                              <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="w-full max-w-2xl h-48 p-4 transition-opacity duration-500 ease-out"
                      style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "300ms" }}
                    >
                      <p className="text-sm font-semibold text-white mb-3">Recovery score (7 days)</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={recoveryOverlayBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={{ stroke: "rgba(255,255,255,0.3)" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={false} tickLine={false} width={28} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {recoveryOverlayBarData.map((entry, index) => (
                              <Cell key={index} fill={getWhoopColor(entry.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
                {expandedWhoop === "strain" && (
                  <>
                    <div className="flex items-center justify-center gap-16">
                      <div
                        className="shrink-0 transition-opacity duration-500 ease-out"
                        style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "0ms" }}
                      >
                        <CircularProgress
                          value={whoopData.strainPercent}
                          size={200}
                          strokeWidth={14}
                          label="Strain"
                          icon={Zap}
                          theme="overlay"
                        />
                      </div>
                      <div
                        className="flex flex-col gap-6 min-w-[280px] transition-opacity duration-500 ease-out"
                        style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "150ms" }}
                      >
                        {(() => {
                          const kj = whoopData.strainKilojoule ?? 0;
                          const calories = Math.round(kj / 4.184);
                          const rows = [
                            { label: "Calories spent", value: calories, display: `${calories} kcal`, max: 3000 },
                            { label: "Average heart rate", value: whoopData.strainAverageHeartRate ?? 0, display: `${Math.round(whoopData.strainAverageHeartRate ?? 0)} bpm`, max: 200 },
                            { label: "Max heart rate", value: whoopData.strainMaxHeartRate ?? 0, display: `${Math.round(whoopData.strainMaxHeartRate ?? 0)} bpm`, max: 200 },
                          ];
                          return rows.map(({ label, value, display, max }) => {
                            const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
                            const color = getWhoopColor(pct);
                            return (
                              <div key={label} className="flex flex-col gap-2">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-sm font-medium text-white">{label}</span>
                                  <span className="text-sm font-semibold text-white">{display}</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                  />
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div
                      className="w-full max-w-2xl h-48 p-4 transition-opacity duration-500 ease-out"
                      style={{ opacity: overlayReveal ? 1 : 0, transitionDelay: "300ms" }}
                    >
                      <p className="text-sm font-semibold text-white mb-3">Strain (7 days)</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={strainOverlayBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={{ stroke: "rgba(255,255,255,0.3)" }} />
                          <YAxis domain={[0, 21]} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.9)" }} axisLine={false} tickLine={false} width={28} />
                          <Bar dataKey="strain" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {strainOverlayBarData.map((entry, index) => (
                              <Cell key={index} fill={getWhoopColor((entry.strain / 21) * 100)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={goToNextOverlay}
                className="shrink-0 p-3 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {/* Alert section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Recent Alerts
          </h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No sessions recorded yet. Start a conversation on the mobile app.</p>
          ) : (
            <div className="grid gap-3">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${alert.level === "warning"
                    ? "bg-amber-50/50 border-amber-100"
                    : alert.level === "critical"
                      ? "bg-red-50/50 border-red-100"
                      : "bg-green-50/50 border-green-100"
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.level === "warning"
                      ? "bg-alert-yellow/20"
                      : alert.level === "critical"
                        ? "bg-alert-red/20"
                        : "bg-alert-green/20"
                      }`}
                  >
                    {alert.level === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-alert-green" />
                    ) : (
                      <AlertTriangle
                        className={`w-5 h-5 ${alert.level === "warning"
                          ? "text-alert-yellow"
                          : "text-alert-red"
                          }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {alert.time}
                  </span>
                  <Link href="/dashboard/cognitive">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Cognitive Score"
            value={latestCogScore !== null ? String(latestCogScore) : "--"}
            unit="/100"
            trend={latestCogScore !== null && latestCogScore >= 65 ? "up" : latestCogScore !== null ? "down" : "stable"}
            trendValue={latestSession ? `Risk: ${latestSession.analysis_result?.risk_score ?? "?"}` : "No data"}
            icon={Brain}
            color="#5B9A8B"
          >
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cognitiveData}>
                  <defs>
                    <linearGradient id="cogGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A90E2" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#5B9A8B"
                    strokeWidth={2}
                    fill="url(#cogGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </MetricCard>

          <MetricCard
            title="Activity Level"
            value="3,400"
            unit="steps"
            trend="up"
            trendValue="+12%"
            icon={Footprints}
            color="#9DC08B"
          >
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <Bar dataKey="steps" fill="#9DC08B" radius={[2, 2, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </MetricCard>

          <MetricCard
            title="Medication Adherence"
            value="95"
            unit="%"
            trend="stable"
            trendValue="Consistent"
            icon={Pill}
            color="#9B51E0"
          >
            <div className="w-full bg-[#F5F7F6] rounded-full h-3 mt-1">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#8B9DC0] to-[#5B9A8B]"
                style={{ width: "95%" }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">19 of 20 doses this week</p>
          </MetricCard>

          <MetricCard
            title="Social Engagement"
            value={String(allSessions.length || 0)}
            unit="conversations"
            trend={allSessions.length > 0 ? "up" : "stable"}
            trendValue={allSessions.length > 0 ? `${allSessions.length} total` : "No data"}
            icon={MessageCircle}
            color="#E8B298"
          >
            <div className="flex items-center gap-2 mt-1">
              {(allSessions.length > 0 ? allSessions.slice(-7) : []).map((s, i) => {
                const score = s.analysis_result?.risk_score ?? 0;
                const h = Math.max(6, Math.min(36, Math.round(score * 1.5)));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-[#E8B298]"
                      style={{ height: `${h}px`, opacity: 0.7 }}
                    />
                  </div>
                );
              })}
            </div>
          </MetricCard>
        </div>

        {/* Bottom section: conversations + events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent conversations */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Recent Conversations
                  </CardTitle>
                  <Link
                    href="/dashboard/transcript"
                    className="text-sm text-[#5B9A8B] hover:underline font-medium"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                {recentConversations.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-4">No conversations yet. Start a chat on the mobile app.</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentConversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href="/dashboard/transcript"
                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F8FAF9]/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#5B9A8B]/10 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-[#5B9A8B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900">
                              {conv.time}
                            </span>
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
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {conv.summary}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming events + quick actions */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${event.type === "medical"
                        ? "bg-blue-100"
                        : event.type === "family"
                          ? "bg-orange-100"
                          : "bg-purple-100"
                        }`}
                    >
                      {event.type === "medical" ? (
                        <Calendar className="w-4 h-4 text-blue-600" />
                      ) : event.type === "family" ? (
                        <Calendar className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Pill className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">{event.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/dashboard/cognitive"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    View cognitive report
                  </span>
                </Link>
                <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Export report for doctor
                  </span>
                </button>
                <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Schedule appointment
                  </span>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
