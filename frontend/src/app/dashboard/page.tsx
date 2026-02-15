"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Footprints,
  Pill,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Calendar,
  Battery,
  Moon,
  Zap,
  FileText,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import {
  fetchAllSessions,
  fetchWhoopRecovery,
  fetchWhoopSleep,
  fetchWhoopCycle,
  type SessionEntry,
} from "@/lib/api";

function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  icon: Icon
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  icon: React.ElementType;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 65) return "#7EC8B8"; // Green
    if (val >= 35) return "#E8C87B"; // Yellow
    return "#D97B7B"; // Red
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F5F7F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
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
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-5 h-5 mb-1 opacity-50" style={{ color }} />
          <span className="text-2xl font-bold text-[#2D3B36]">{value}%</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-[#6B7C74]">{label}</span>
    </div>
  );
}

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
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
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
  const [whoopData, setWhoopData] = useState({ sleep: 0, recovery: 0, strainPercent: 0 });
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessionsData, recoveryData, sleepData, cycleData] = await Promise.all([
          fetchAllSessions(),
          fetchWhoopRecovery().catch(() => null),
          fetchWhoopSleep().catch(() => null),
          fetchWhoopCycle().catch(() => null),
        ]);
        setSessions(sessionsData);

        // Extract latest whoop values
        const latestRecovery = recoveryData?.records?.[0]?.score?.recovery_score ?? 0;
        const latestSleep = sleepData?.records?.[0]?.score?.sleep_performance_percentage ?? 0;
        const latestStrain = cycleData?.records?.[0]?.score?.strain ?? 0;
        // Normalize strain (max ~21) to percentage
        const strainPercent = Math.round((latestStrain / 21) * 100);
        setWhoopData({ recovery: Math.round(latestRecovery), sleep: Math.round(latestSleep), strainPercent });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Derive cognitive chart data from sessions (risk scores over time)
  const cognitiveData = sessions.map((s, i) => ({
    day: s.session_date || `S${i + 1}`,
    score: 100 - (s.analysis_result?.risk_score ?? 0), // invert: lower risk = higher cognitive score
  }));

  // Derive alerts from latest session's flagged markers
  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const alerts: { level: string; title: string; description: string; time: string }[] = [];
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
  const recentConversations = sessions.slice().reverse().slice(0, 5).map((s, i) => {
    const markerCount = s.analysis_result?.rule_based?.markers?.filter((m) => m.flagged).length ?? 0;
    return {
      id: i + 1,
      time: s.session_date || new Date(s.timestamp).toLocaleString(),
      duration: `${s.analysis_result?.rule_based?.total_words ?? 0} words`,
      summary: s.analysis_result?.rule_based_summary || "Session recorded",
      markers: markerCount,
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
            <CircularProgress
              value={whoopData.recovery}
              label="Recovery"
              icon={Battery}
            />
            <CircularProgress
              value={whoopData.sleep}
              label="Sleep Performance"
              icon={Moon}
            />
            <CircularProgress
              value={whoopData.strainPercent}
              label="Daily Strain"
              icon={Zap}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert section */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Recent Alerts
        </h2>
        {alerts.length === 0 && sessions.length === 0 ? (
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
          trend={latestCogScore !== null && latestCogScore >= 65 ? "up" : "down"}
          trendValue={latestCogScore !== null ? `Risk: ${latestSession?.analysis_result?.risk_score}` : "No data"}
          icon={Brain}
          color="#5B9A8B"
        >
          <div className="h-16">
            {cognitiveData.length > 0 ? (
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
            ) : (
              <p className="text-xs text-gray-400 pt-4">No sessions yet</p>
            )}
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
          value={String(sessions.length || 0)}
          unit="conversations"
          trend="up"
          trendValue={sessions.length > 0 ? `${sessions.length} total` : "No data"}
          icon={MessageCircle}
          color="#E8B298"
        >
          <div className="flex items-center gap-2 mt-1">
            {(sessions.length > 0 ? sessions.slice(-7) : []).map((s, i) => {
              const score = s.analysis_result?.risk_score ?? 0;
              const h = Math.max(6, Math.min(36, score * 1.5));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-[#E8B298]" style={{ height: `${h}px`, opacity: 0.7 }} />
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
                      ? "bg-care-blue/10"
                      : event.type === "family"
                        ? "bg-care-orange/10"
                        : "bg-care-purple/10"
                      }`}
                  >
                    {event.type === "medical" ? (
                      <Calendar className="w-4 h-4 text-care-blue" />
                    ) : event.type === "family" ? (
                      <Calendar className="w-4 h-4 text-care-orange" />
                    ) : (
                      <Pill className="w-4 h-4 text-care-purple" />
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
                <Brain className="w-5 h-5 text-care-blue" />
                <span className="text-sm font-medium text-gray-700">
                  View cognitive report
                </span>
              </Link>
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                <FileText className="w-5 h-5 text-care-purple" />
                <span className="text-sm font-medium text-gray-700">
                  Export report for doctor
                </span>
              </button>
              <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors w-full text-left">
                <Clock className="w-5 h-5 text-care-orange" />
                <span className="text-sm font-medium text-gray-700">
                  Schedule appointment
                </span>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
