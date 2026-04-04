"use client";

// app/dashboard/admin/reviews/page.tsx
import { useEffect, useState, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaStar,
  FaTrash,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Review } from "@/types";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type Audience = "all" | "hosts" | "users";

const AUDIENCE_OPTIONS: { label: string; value: Audience }[] = [
  { label: "All users", value: "all" },
  { label: "Hosts only", value: "hosts" },
  { label: "Guests only", value: "users" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          className={`text-xs ${
            s <= rating ? "text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Email broadcast state
  const [audience, setAudience] = useState<Audience>("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchReviews = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const res = await api.get("/reviews");
      const data = res.data.data ?? res.data;
      setReviews(data.reviews ?? data);
    } catch {
      // handled by interceptor
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function deleteReview(id: string) {
    setActionLoading(id + "-delete");
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // handled
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  }

  async function sendBroadcast(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setIsSending(true);
    try {
      const res = await api.post("/admin/email/broadcast", {
        audience,
        subject: subject.trim(),
        message: message.trim(),
      });
      const sentCount =
        res.data?.data?.sentCount ?? res.data?.sentCount ?? null;
      toast.success(
        sentCount !== null
          ? `Email sent to ${sentCount} recipient${sentCount !== 1 ? "s" : ""}`
          : "Broadcast sent successfully"
      );
      setSubject("");
      setMessage("");
    } catch {
      // handled
    } finally {
      setIsSending(false);
    }
  }

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AdminPageGuard permission={P.MANAGE_REVIEWS}>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/admin"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Reviews & Broadcast
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Moderate reviews and send email announcements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── SECTION 1: Reviews ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <FaStar className="text-amber-400" />
              <h2 className="font-semibold text-gray-900 text-base">
                All Reviews
              </h2>
              <span className="text-xs text-gray-400">
                ({reviews.length})
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
                No reviews yet.
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {reviews.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Link href={`/users/${r.user?.id}`} title="View profile">
                          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0 hover:opacity-80 transition">
                            {r.user?.firstName?.[0]}
                            {r.user?.lastName?.[0]}
                          </div>
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <Link
                              href={`/users/${r.user?.id}`}
                              className="font-medium text-gray-900 text-sm hover:text-black hover:underline transition"
                              title="View reviewer profile"
                            >
                              {r.user?.firstName} {r.user?.lastName}
                            </Link>
                            <StarRating rating={r.rating} />
                          </div>
                          {r.propertyId && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Property: <span className="text-gray-600 font-mono text-xs">{r.propertyId.slice(0, 8)}…</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                            {r.comment}
                          </p>
                          <p className="text-xs text-gray-300 mt-1.5">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(r.id)}
                          title="Delete review"
                          className="w-8 h-8 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 flex items-center justify-center transition flex-shrink-0"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── SECTION 2: Email Broadcast ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                  <FaEnvelope className="text-white text-xs" />
                </div>
                <h2 className="font-semibold text-gray-900 text-base">
                  Email Broadcast
                </h2>
              </div>

              <form onSubmit={sendBroadcast} className="space-y-4">
                {/* Audience */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as Audience)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject…"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message…"
                    required
                    rows={6}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-3 rounded-xl bg-black text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaPaperPlane className="text-xs" />
                      Send Broadcast
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-bold text-gray-900 text-base mb-2">
                Delete review?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This review will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteReview(deleteTarget)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </AdminPageGuard>
  );
}
