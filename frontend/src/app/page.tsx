"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Mic,
  Activity,
  Heart,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Users,
  FileText,
  Zap,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const problemCards = [
  {
    icon: Users,
    title: "Tech Has Left Seniors Behind",
    description:
      "Ever helped your grandparents with an iPad? What happens when they need to manage medicine or health records on vacation? Modern technology has become too complex for those who need it most.",
    color: "#E8B298",
    image: "/images/issue-1-graphic.png",
  },
  {
    icon: Heart,
    title: "Loneliness Fuels Dementia",
    description: "Loneliness increases dementia risk by 50%. Limited social interactions contribute to cognitive decline, which is painful for patients, families, and caregivers alike.",
    color: "#8B9DC0",
    image: "/images/issue-2-graphic.png",
  },
  {
    icon: Activity,
    title: "Aging Population Crisis",
    description:
      "By 2030, one in six people worldwide will be over 65 and this will double by 2050. Healthcare systems urgently need innovative solutions to support this demographic shift.",
    color: "#9DC08B",
    image: "/images/issue-3-graphic.png",
  },
];

const solutionFeatures = [
  {
    icon: Mic,
    title: "Voice-First Task Management",
    description:
      "Handle tasks naturally: 'Help me view my vaccine history' or 'Order my medicine refill.' No apps to learn, no buttons to press — just conversation.",
    color: "#5B9A8B",
    image: "/images/solution-1-graphic.png",
  },
  {
    icon: Brain,
    title: "Passive Biomarker Detection",
    description:
      "AI analyzes speech for early warning signs: reduced vocabulary range, word-finding pauses (like forgetting 'refrigerator'), and changes in speech patterns.",
    color: "#7EC8B8",
    image: "/images/solution-2-graphic.png",
  },
  {
    icon: Stethoscope,
    title: "Clinical AI Analysis",
    description:
      "Our AI agent interprets symptoms using clinical data from OpenEvidence. 'Help me check in on my health' provides deep, personalized health insights.",
    color: "#5B9A8B",
    image: "/images/solution-3-graphic.png",
  },
  {
    icon: BarChart3,
    title: "Empowering Healthcare Providers",
    description:
      "Real-time dashboards and exportable reports give doctors and families the resources they need to support the growing elderly population.",
    color: "#8B9DC0",
    image: "/images/solution-4-graphic.png",
  },
];

// const stats = [
//   { value: "55M+", label: "Americans affected by cognitive decline" },
//   { value: "40%", label: "Of cases can be delayed or prevented" },
//   { value: "3-5yrs", label: "Earlier detection through voice biomarkers" },
//   { value: "67%", label: "Reduction in loneliness with AI companions" },
// ];

const researchPoints = [
  {
    title: "Redefining Elderly Care with Agentic AI",
    source: "Khalil, Adhmad, & Ali, 2025",
    finding:
      "Agentic AI provides critical solutions to the global aging crisis by enabling personalized companionship, health monitoring, and predictive care, directly addressing workforce shortages and reducing social isolation.",
  },
  {
    title: "Loneliness as a Dementia Risk Factor",
    source: "The Lancet Commission, 2024",
    finding:
      "Social isolation increases dementia risk by 50% and is one of 14 modifiable risk factors. Regular social interaction — even with AI companions — shows measurable cognitive benefits.",
  },
  {
    title: "Voice Biomarkers Detect Decline Early",
    source: "Journal of Alzheimer's Disease, 2024",
    finding:
      "Speech analysis detects cognitive decline 3-5 years before clinical diagnosis through markers like word-finding pauses, reduced vocabulary diversity, and sentence complexity changes.",
  },
  {
    title: "Global Aging Population Surge",
    source: "United Nations Population Report, 2024",
    finding:
      "By 2030, one in six people worldwide will be over 65, with this number doubling by 2050. Healthcare systems face urgent pressure to develop innovative elderly care solutions.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // accepts any login for now
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLogin(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FAFCFB]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5EBE8]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B9A8B] to-[#7EC8B8] flex items-center justify-center shadow-sm">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-lg text-[#2D3B36]">CareCompanion</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm text-[#6B7C74] hover:text-[#2D3B36] transition-colors font-medium">
              Features
            </a>
            <a href="#research" className="text-sm text-[#6B7C74] hover:text-[#2D3B36] transition-colors font-medium">
              Research
            </a>
            <a href="#team" className="text-sm text-[#6B7C74] hover:text-[#2D3B36] transition-colors font-medium">
              Team
            </a>
          </div>
          <div className="flex items-center gap-3">
            {showLogin ? (
              <form onSubmit={handleLogin} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-[#E5EBE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9A8B]/30"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-[#E5EBE8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9A8B]/30"
                />
                <Button type="submit" className="bg-[#5B9A8B] hover:bg-[#4A8577] text-white text-sm">
                  Log in
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowLogin(false)}>
                  Cancel
                </Button>
              </form>
            ) : (
              <Button
                onClick={() => setShowLogin(true)}
                className="bg-[#5B9A8B] hover:bg-[#4A8577] text-white text-sm gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            )}
            <Link href="/dashboard">
              <Button variant="outline" className="text-sm border-[#E5EBE8]">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white min-h-[100vh] flex items-center">
        <div className="relative max-w-7xl mx-auto px-12 md:px-16 lg:px-24 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2D3B36] leading-[1.1] mb-5 tracking-tight">
                Senior care that{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B9A8B] to-[#7EC8B8]">
                  listens
                </span>
              </h1>

              <p className="text-base md:text-lg text-[#6B7C74] leading-relaxed mb-10">
                While apps got more complicated, seniors got left behind. We&apos;re fixing that with a voice-based AI caretaker that completes your chores and prevents cognitive decline.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-[#5B9A8B] hover:bg-[#4A8577] text-white text-base px-8 h-14 rounded-2xl gap-2 shadow-lg shadow-[#5B9A8B]/20"
                  >
                    View dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <Image
                src="/images/treehacks-hero-photo.png"
                alt="Two people hugging, representing care and companionship"
                width={500}
                height={500}
                priority
                className="w-full max-w-[500px] ml-16 h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section id="problem" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              The Problem
            </h2>
            <p className="text-lg text-[#6B7C74] max-w-2xl mx-auto">
              Technology has advanced rapidly, but it&apos;s left our most vulnerable population behind.
            </p>
          </motion.div>

          <div className="space-y-24">
            {problemCards.map((problem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
              >
                {/* Text Side */}
                <div className="flex-1">
                  <div className="inline-flex items-center mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${problem.color}15` }}
                    >
                      <problem.icon
                        className="w-6 h-6"
                        style={{ color: problem.color }}
                      />
                    </div>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-6 leading-tight">
                    {problem.title}
                  </h3>
                  <p className="text-lg text-[#6B7C74] leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full flex justify-center items-center">
                  <Image
                    src={problem.image}
                    alt={problem.title}
                    width={600}
                    height={400}
                    className="w-full max-w-[500px] h-auto"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section id="solution" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-24">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              Our Solution
            </h2>
            <p className="text-lg text-[#6B7C74] max-w-2xl mx-auto">
              A conversational AI caretaker that&apos;s as easy as talking to a friend.
            </p>
          </motion.div>

          <div className="space-y-32">
            {solutionFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}
              >
                {/* Text Side */}
                <div className="flex-1">
                  <div className="inline-flex items-center mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <feature.icon
                        className="w-6 h-6"
                        style={{ color: feature.color }}
                      />
                    </div>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-6 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-[#6B7C74] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full flex justify-center items-center">
                  <Image
                    src={feature.image || ""}
                    alt={feature.title}
                    width={600}
                    height={400}
                    className="w-full max-w-[500px] h-auto"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research */}
      <section id="research" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              Why This Matters
            </h2>
            <p className="text-lg text-[#6B7C74] max-w-2xl mx-auto">
              The science behind our approach and the urgency of the problem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {researchPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="border border-[#E5EBE8] shadow-sm bg-[#FAFCFB] h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-[#5B9A8B]" />
                      <span className="text-xs font-medium text-[#5B9A8B]">
                        {point.source}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#2D3B36] mb-2">
                      {point.title}
                    </h3>
                    <p className="text-sm text-[#6B7C74] leading-relaxed">
                      {point.finding}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 bg-[#F8FAF9]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              How it works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="bg-white rounded-2xl p-8 h-full border border-[#E5EBE8] shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#5B9A8B]/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-6 h-6 text-[#5B9A8B]" />
                  </div>
                  <div className="text-xs font-semibold text-[#5B9A8B] mb-2 uppercase tracking-wide">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D3B36] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#6B7C74] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      { /* <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-12 md:px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center bg-white rounded-2xl p-6 border border-[#E5EBE8] shadow-sm">
                <p className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-[#6B7C74]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section> */}

      {/* Two interfaces section */}
      <section className="py-28 bg-[#F8FAF9]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              Two interfaces, one mission
            </h2>
            <p className="text-lg text-[#6B7C74] max-w-2xl mx-auto">
              Designed for the people who matter most — your loved ones and
              their caregivers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Elderly interface */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-2xl p-8 h-full border border-[#E5EBE8] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-[#5B9A8B]/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#5B9A8B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D3B36]">
                      For Your Loved One
                    </h3>
                    <p className="text-sm text-[#6B7C74]">
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
                      className="flex items-center gap-3 text-sm text-[#3D4F47]"
                    >
                      <ChevronRight className="w-4 h-4 text-[#5B9A8B] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 italic">
                  Download our mobile app to use companion mode
                </p>
              </div>
            </motion.div>

            {/* Dashboard interface */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-2xl p-8 h-full border border-[#E5EBE8] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-[#7EC8B8]/15 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#5B9A8B]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2D3B36]">
                      For Caretakers
                    </h3>
                    <p className="text-sm text-[#6B7C74]">
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
                      className="flex items-center gap-3 text-sm text-[#3D4F47]"
                    >
                      <ChevronRight className="w-4 h-4 text-[#7EC8B8] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="gap-2 w-full h-12 rounded-xl border-[#E5EBE8] text-[#5B9A8B] hover:bg-[#E8F3F1] hover:border-[#D5DDD9]"
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

      {/* leave this out for now - TreeHacks 2026 */}
      {/*
      <section id="team" className="py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3B36] mb-4 tracking-tight">
              Built with care
            </h2>
            <p className="text-lg text-[#6B7C74] max-w-2xl mx-auto">
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5B9A8B]/15 to-[#7EC8B8]/15 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-[#5B9A8B]/70" />
                </div>
                <p className="text-sm font-semibold text-[#2D3B36]">
                  {member.name}
                </p>
                <p className="text-xs text-[#6B7C74]">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-[#5B9A8B] via-[#6BA99A] to-[#7EC8B8]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Technology that doesn&apos;t feel like technology
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Start a conversation. Detect early. Intervene sooner. Keep your
              loved ones connected and cared for.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-care-blue hover:bg-care-blue/90 text-white text-lg px-8 h-14 rounded-xl gap-2"
                >
                  View dashboard
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#FAFCFB] border-t border-[#E5EBE8]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#5B9A8B] to-[#7EC8B8] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-[#6B7C74]">
              CareCompanion
            </span>
          </div>
          <p className="text-sm text-[#9CA8A2]">
            Built with care at Stanford&apos;s TreeHacks 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
