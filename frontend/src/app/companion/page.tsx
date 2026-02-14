"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Settings, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function WaveformBar({ index }: { index: number }) {
  const [height, setHeight] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeight(Math.random() * 40 + 8);
    }, 150 + index * 50);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <motion.div
      className="w-1.5 rounded-full bg-white/80"
      animate={{ height }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
    />
  );
}

export default function CompanionHome() {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("Tap to talk");
  const [greeting, setGreeting] = useState("");
  const router = useRouter();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const toggleListening = useCallback(() => {
    if (!isListening) {
      setIsListening(true);
      setStatusText("Listening...");
      // Simulate navigating to conversation after a delay
      setTimeout(() => {
        router.push("/companion/conversation");
      }, 2000);
    } else {
      setIsListening(false);
      setStatusText("Tap to talk");
    }
  }, [isListening, router]);

  return (
    <div className="min-h-screen bg-care-gradient flex flex-col items-center justify-between relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-care-blue/10 blur-3xl animate-float" />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-care-purple/8 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-care-green/6 blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between p-6 z-10">
        <Link href="/" className="p-3 rounded-2xl glass hover:bg-white/70 transition-colors">
          <Home className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="glass rounded-full px-6 py-3">
          <span className="text-lg font-medium text-gray-700">CareCompanion</span>
        </div>
        <button className="p-3 rounded-2xl glass hover:bg-white/70 transition-colors">
          <Settings className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 px-6 -mt-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {greeting}
          </h1>
          <p className="text-2xl text-gray-500">I&apos;m here to help</p>
        </motion.div>

        {/* Pulsing listen button */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Outer pulse rings */}
          <AnimatePresence>
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.6], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute w-56 h-56 rounded-full bg-care-blue/20"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1.4], opacity: [0.3, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5,
                  }}
                  className="absolute w-56 h-56 rounded-full bg-care-blue/15"
                />
              </>
            )}
          </AnimatePresence>

          {/* Main button */}
          <motion.button
            onClick={toggleListening}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className={`relative w-44 h-44 md:w-52 md:h-52 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isListening
                ? "bg-gradient-to-br from-care-blue to-care-blue/80 shadow-care-blue/30"
                : "glass-strong shadow-black/5 hover:shadow-black/10"
            }`}
          >
            {/* Waveform when listening */}
            {isListening ? (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <WaveformBar key={i} index={i} />
                ))}
              </div>
            ) : (
              <Mic className="w-16 h-16 text-care-blue" />
            )}
          </motion.button>
        </div>

        {/* Status text */}
        <motion.div
          key={statusText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-3xl font-semibold text-gray-800 mb-2">
            {statusText}
          </p>
          <p className="text-xl text-gray-400">
            {isListening
              ? "Speak naturally, I'm listening"
              : "Press the button and start talking"}
          </p>
        </motion.div>
      </div>

      {/* Bottom info */}
      <div className="w-full p-6 z-10">
        <div className="glass rounded-2xl p-5 max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-alert-green animate-pulse" />
            <span className="text-lg font-medium text-gray-700">
              Connected & Ready
            </span>
          </div>
          <p className="text-base text-gray-500 leading-relaxed">
            Ask me anything — check your schedule, take your medications, or
            just chat.
          </p>
        </div>
      </div>
    </div>
  );
}
