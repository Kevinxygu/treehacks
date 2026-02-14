"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Mic,
  Activity,
  Heart,
  Shield,
  BarChart3,
  MessageCircle,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Users,
  Sparkles,
  Clock,
  FileText,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Mic,
    title: "Voice-Activated Assistant",
    description:
      "Natural voice conversations that feel like talking to a caring friend. No complicated interfaces — just speak.",
    color: "#4A90E2",
  },
  {
    icon: Brain,
    title: "Cognitive Decline Detection",
    description:
      "Passive analysis of voice biomarkers detects early signs of cognitive decline through speech patterns and memory markers.",
    color: "#9B51E0",
  },
  {
    icon: Activity,
    title: "WHOOP Integration",
    description:
      "Combines voice analysis with wearable health data for holistic monitoring of sleep, activity, and recovery.",
    color: "#7ED321",
  },
  {
    icon: Heart,
    title: "Reminiscence Therapy",
    description:
      "Personalized photo and memory-based conversations that strengthen neural pathways and prevent loneliness.",
    color: "#F5A623",
  },
  {
    icon: Shield,
    title: "Doctor-Prescribed Interventions",
    description:
      "Evidence-based intervention plans designed by healthcare professionals to slow or reverse cognitive decline.",
    color: "#D0021B",
  },
  {
    icon: BarChart3,
    title: "Caretaker Dashboard",
    description:
      "Real-time monitoring dashboard for family members and healthcare providers with exportable reports.",
    color: "#2D5BFF",
  },
];

const stats = [
  { value: "55M+", label: "Americans affected by cognitive decline" },
  { value: "40%", label: "Of cases can be delayed or prevented" },
  { value: "3-5yrs", label: "Earlier detection through voice biomarkers" },
  { value: "67%", label: "Reduction in loneliness with AI companions" },
];

const researchPoints = [
  {
    title: "Voice Biomarkers for Early Detection",
    source: "Journal of Alzheimer's Disease, 2024",
    finding:
      "Speech pattern analysis can detect cognitive decline up to 5 years before clinical diagnosis through markers like word-finding pauses, vocabulary diversity, and sentence complexity.",
  },
  {
    title: "Social Isolation Accelerates Decline",
    source: "The Lancet Commission, 2024",
    finding:
      "Social isolation is identified as one of 14 modifiable risk factors for dementia. Regular social interaction — even with AI companions — shows measurable cognitive benefits.",
  },
  {
    title: "Multimodal Health Monitoring",
    source: "Nature Digital Medicine, 2024",
    finding:
      "Combining wearable sensor data (sleep, HRV, activity) with cognitive assessments improves prediction accuracy of MCI progression by 40% over single-modality approaches.",
  },
  {
    title: "Reminiscence Therapy Efficacy",
    source: "Cochrane Systematic Review, 2023",
    finding:
      "Structured reminiscence therapy shows significant improvements in mood, cognitive function, and quality of life for individuals with mild to moderate cognitive impairment.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-care-blue to-care-purple flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">CareCompanion</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#research" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Research
            </a>
            <a href="#team" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Team
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/companion">
              <Button variant="ghost" className="text-sm">
                Try Companion
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-care-blue hover:bg-care-blue/90 text-white text-sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-care-gradient pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-care-blue/8 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-care-purple/6 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-care-blue/10 text-care-blue text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Built at TreeHacks 2026
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Care that{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-care-blue to-care-purple">
                listens
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              An AI voice companion that detects cognitive decline early,
              provides meaningful companionship, and keeps families connected.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/companion">
                <Button
                  size="lg"
                  className="bg-care-blue hover:bg-care-blue/90 text-white text-lg px-8 h-14 rounded-xl gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Try the companion
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 h-14 rounded-xl gap-2"
                >
                  View dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center glass rounded-2xl p-6">
                <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything your loved one needs
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A comprehensive platform combining voice AI, wearable data, and
              clinical research to support aging with dignity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-white group h-full">
                  <CardContent className="p-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <feature.icon
                        className="w-6 h-6"
                        style={{ color: feature.color }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-care-gradient">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Mic,
                title: "Natural Conversation",
                description:
                  "Your loved one speaks naturally with CareCompanion. No buttons, no menus — just talk like a friend.",
              },
              {
                step: "2",
                icon: Brain,
                title: "Passive Analysis",
                description:
                  "Our AI analyzes voice biomarkers — pauses, vocabulary, speech patterns — to detect cognitive changes early.",
              },
              {
                step: "3",
                icon: Stethoscope,
                title: "Actionable Insights",
                description:
                  "Family members and doctors receive clear reports with recommendations, trends, and alerts.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="glass-strong rounded-3xl p-8 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-care-blue/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-7 h-7 text-care-blue" />
                  </div>
                  <div className="text-sm font-bold text-care-blue mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research */}
      <section id="research" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built on research
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Our approach is grounded in peer-reviewed clinical research and
              the latest advances in digital health.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {researchPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-sm bg-gray-50/80 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-care-blue" />
                      <span className="text-xs font-medium text-care-blue">
                        {point.source}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {point.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {point.finding}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Two interfaces section */}
      <section className="py-24 bg-care-gradient">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Two interfaces, one mission
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Designed for the people who matter most — your loved ones and
              their caregivers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Elderly interface */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-strong rounded-3xl p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-care-blue/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-care-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      For Your Loved One
                    </h3>
                    <p className="text-sm text-gray-500">
                      Voice-first, calming, accessible
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Massive text and buttons (24pt+)",
                    "Voice-activated — no complex interfaces",
                    "Calming colors and gentle animations",
                    "Morning check-ins and reminders",
                    "Reminiscence therapy with photos",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <ChevronRight className="w-4 h-4 text-care-blue flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/companion">
                  <Button className="bg-care-blue hover:bg-care-blue/90 text-white gap-2 w-full h-12 rounded-xl">
                    <Mic className="w-4 h-4" />
                    Try companion mode
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Dashboard interface */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-strong rounded-3xl p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-care-purple/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-care-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      For Caretakers
                    </h3>
                    <p className="text-sm text-gray-500">
                      Data-rich, professional, actionable
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Real-time cognitive health scores",
                    "Annotated conversation transcripts",
                    "Speech biomarker trend analysis",
                    "Exportable reports for doctors",
                    "Alerts and intervention recommendations",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <ChevronRight className="w-4 h-4 text-care-purple flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="gap-2 w-full h-12 rounded-xl border-care-purple/30 text-care-purple hover:bg-care-purple/5"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built with care
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Our team at TreeHacks 2026 is passionate about using technology
              to improve the lives of aging adults and their families.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { name: "Team Member 1", role: "ML & Voice AI" },
              { name: "Team Member 2", role: "Full-Stack" },
              { name: "Team Member 3", role: "Frontend & Design" },
              { name: "Team Member 4", role: "Backend & Health" },
            ].map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-care-blue/20 to-care-purple/20 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-care-blue/60" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-care-blue to-care-purple">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Technology that doesn&apos;t feel like technology
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Start a conversation. Detect early. Intervene sooner. Keep your
              loved ones connected and cared for.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/companion">
                <Button
                  size="lg"
                  className="bg-white text-care-blue hover:bg-white/90 text-lg px-8 h-14 rounded-xl gap-2"
                >
                  <Mic className="w-5 h-5" />
                  Get started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 text-lg px-8 h-14 rounded-xl gap-2"
                >
                  Explore dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-care-blue to-care-purple flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              CareCompanion
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Built with care at TreeHacks 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
