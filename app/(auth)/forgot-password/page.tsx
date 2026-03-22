"use client";

// app/(auth)/forgot-password/page.tsx
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      // Error toast handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="relative z-10 text-center px-12">
          <Link href="/" className="font-playfair text-4xl font-bold text-secondary block mb-6">
            Asavio
          </Link>
          <h2 className="text-white text-3xl font-playfair font-bold mb-4">Reset your password</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            We&apos;ll send you a secure link to get back into your account.
          </p>
        </div>
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full border border-yellow-500/10" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full border border-yellow-500/10" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="lg:hidden font-playfair text-3xl font-bold text-black block mb-8 text-center">
            Asavio
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FaCheckCircle className="text-green-500 text-5xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
              <p className="text-gray-500 mb-8">
                If <strong>{email}</strong> is registered, we&apos;ve sent a reset link. It expires in 1 hour.
              </p>
              <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8 transition-colors">
                <FaArrowLeft className="text-xs" /> Back to sign in
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
              <p className="text-gray-500 mb-8">
                Enter your account email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
