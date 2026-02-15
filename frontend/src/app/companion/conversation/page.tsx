"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, ArrowLeft, Volume2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

const dummyConversation: Message[] = [
  {
    id: 1,
    role: "assistant",
    text: "Good morning, Margaret! How are you feeling today?",
    timestamp: "8:02 AM",
  },
  {
    id: 2,
    role: "user",
    text: "Oh, good morning! I slept pretty well. A little stiff this morning though.",
    timestamp: "8:02 AM",
  },
  {
    id: 3,
    role: "assistant",
    text: "I'm glad you slept well! A little stiffness is normal. Would you like me to remind you about your morning stretches? Also, don't forget — you have your medication at 8:30.",
    timestamp: "8:03 AM",
  },
  {
    id: 4,
    role: "user",
    text: "Oh yes, the stretches would be nice. And thank you for the reminder about my pills.",
    timestamp: "8:03 AM",
  },
  {
    id: 5,
    role: "assistant",
    text: "Of course! Let's start with some gentle neck rolls. Turn your head slowly to the right... hold for 5 seconds... now slowly to the left. You're doing great!",
    timestamp: "8:04 AM",
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-care-blue/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Simulate conversation loading
  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      for (let i = 0; i < dummyConversation.length; i++) {
        if (cancelled) return;
        if (dummyConversation[i].role === "assistant") {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 800));
          if (cancelled) return;
          setIsTyping(false);
        }
        await new Promise((r) => setTimeout(r, 300));
        if (cancelled) return;
        setMessages((prev) => [...prev, dummyConversation[i]]);
      }
    };
    loadMessages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const handleEndChat = () => {
    router.push("/companion/confirmation");
  };

  return (
    <div className="min-h-screen bg-care-gradient flex flex-col relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-care-blue/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-care-purple/6 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-5 z-10">
        <Link
          href="/companion"
          className="p-3 rounded-2xl glass hover:bg-white/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="glass rounded-full px-5 py-2.5 flex items-center gap-2">
          {isAiSpeaking && (
            <Volume2 className="w-5 h-5 text-care-blue animate-pulse" />
          )}
          <span className="text-lg font-medium text-gray-700">
            CareCompanion
          </span>
        </div>
        <div className="w-12" />
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-4 z-10 smooth-scroll"
      >
        <div className="max-w-2xl mx-auto space-y-4 py-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  msg.role === "user" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-6 py-4 ${
                    msg.role === "user"
                      ? "glass-strong rounded-tl-lg"
                      : "bg-care-blue text-white rounded-tr-lg shadow-lg shadow-care-blue/20"
                  }`}
                >
                  <p
                    className={`text-xl leading-relaxed ${
                      msg.role === "user" ? "text-gray-800" : "text-white"
                    }`}
                  >
                    {msg.text}
                  </p>
                  <p
                    className={`text-sm mt-2 ${
                      msg.role === "user"
                        ? "text-gray-400"
                        : "text-white/60"
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div className="bg-care-blue/10 rounded-3xl rounded-tr-lg">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-5 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsListening(!isListening)}
            className={`flex-1 h-[70px] rounded-2xl flex items-center justify-center gap-3 text-xl font-semibold transition-all duration-300 ${
              isListening
                ? "bg-care-blue text-white shadow-lg shadow-care-blue/30"
                : "glass-strong text-gray-700 hover:bg-white/80"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-7 h-7" />
                Listening...
              </>
            ) : (
              <>
                <Mic className="w-7 h-7" />
                Tap to speak
              </>
            )}
          </motion.button>

          {/* End chat */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleEndChat}
            className="h-[70px] px-8 rounded-2xl glass-strong text-gray-500 text-lg font-medium hover:bg-white/80 transition-colors"
          >
            End chat
          </motion.button>
        </div>
      </div>
    </div>
  );
}
