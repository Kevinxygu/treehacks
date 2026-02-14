"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-care-gradient flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-care-green/10 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-care-blue/8 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="z-10 w-full max-w-lg">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div className="w-28 h-28 rounded-full bg-care-green/15 flex items-center justify-center">
            <CheckCircle2 className="w-20 h-20 text-care-green" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            All done!
          </h1>
          <p className="text-2xl text-gray-500">
            Your medication refill has been ordered
          </p>
        </motion.div>

        {/* Details card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-strong rounded-3xl p-8 mb-8 space-y-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-care-blue/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-care-blue" />
            </div>
            <div>
              <p className="text-lg text-gray-500">Delivery</p>
              <p className="text-2xl font-semibold text-gray-900">Thursday by 2:00 PM</p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-care-green/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-care-green" />
            </div>
            <div>
              <p className="text-lg text-gray-500">Cost</p>
              <p className="text-2xl font-semibold text-gray-900">$15.00 <span className="text-lg text-care-green font-normal">(covered by insurance)</span></p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-200" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-care-purple/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-care-purple" />
            </div>
            <div>
              <p className="text-lg text-gray-500">Medication</p>
              <p className="text-2xl font-semibold text-gray-900">Lisinopril 10mg</p>
              <p className="text-lg text-gray-500 mt-1">30-day supply, auto-refill enabled</p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <Link href="/companion" className="block">
            <button className="w-full h-[70px] rounded-2xl bg-care-blue text-white text-2xl font-semibold shadow-lg shadow-care-blue/20 hover:bg-care-blue/90 transition-colors">
              Got it, thanks!
            </button>
          </Link>

          <Link href="/companion" className="block">
            <button className="w-full h-[60px] rounded-2xl glass text-gray-500 text-xl font-medium hover:bg-white/70 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back to home
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
