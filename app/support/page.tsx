"use client";

// app/support/page.tsx
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaEnvelope, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

type TicketCategory = "payment" | "booking" | "listing" | "account" | "other";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  message: string;
  status: TicketStatus;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "payment",  label: "Payment issue" },
  { value: "booking",  label: "Booking problem" },
  { value: "listing",  label: "Listing / property issue" },
  { value: "account",  label: "Account or login" },
  { value: "other",    label: "Other / general enquiry" },
];

const STATUS_STYLE: Record<TicketStatus, string> = {
  open:        "bg-red-100 text-red-700",
  in_progress: "bg-orange-100 text-orange-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100 text-gray-500",
};

function SupportContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Auto-expand a ticket if ?ticket=id is present
  useEffect(() => {
    const id = searchParams.get("ticket");
    if (id) setExpandedTicket(id);
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingTickets(true);
    api
      .get("/support")
      .then((res) => setMyTickets(res.data.data.tickets))
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  }, [isAuthenticated, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/support", { subject: subject.trim(), category, message: message.trim() });
      setSubmitted(true);
      setSubject("");
      setCategory("other");
      setMessage("");
      toast.success("Ticket submitted — we'll be in touch shortly");
    } catch {
      // interceptor handles
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image src="/logo_with_text.png" alt="Asavio" width={100} height={32} className="h-8 w-auto" />
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard/user" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
              My dashboard
            </Link>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
              Log in
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Support Centre</h1>
          <p className="text-gray-500 mt-2">
            Having an issue with a payment, booking, or anything else on the platform? Let us know.
          </p>
        </div>

        {/* Submit form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Submit a request</h2>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <FaCheckCircle className="text-green-500 text-4xl mb-3" />
                <p className="font-semibold text-gray-900">Request received!</p>
                <p className="text-sm text-gray-500 mt-1">
                  We've sent a confirmation to your email. Our team will respond as soon as possible.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-5 text-sm text-gray-500 underline hover:text-black transition-colors"
                >
                  Submit another request
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    maxLength={200}
                    required
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Details
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue in as much detail as possible — include booking IDs, dates, amounts, or anything else relevant."
                    rows={6}
                    maxLength={2000}
                    required
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{message.length}/2000</p>
                </div>

                {!isAuthenticated && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    You need to be <Link href="/login" className="underline font-medium">logged in</Link> to submit a support request.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !isAuthenticated}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <FaEnvelope />
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* My tickets */}
        {isAuthenticated && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">My previous tickets</h2>

            {loadingTickets ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              </div>
            ) : myTickets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No previous requests.</p>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status]}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString("en-GB")}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                      </div>
                      {expandedTicket === ticket.id ? <FaChevronUp className="text-gray-400 shrink-0" /> : <FaChevronDown className="text-gray-400 shrink-0" />}
                    </button>

                    <AnimatePresence>
                      {expandedTicket === ticket.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 mb-1">Your message</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                            {ticket.adminResponse ? (
                              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-black">
                                <p className="text-xs font-semibold text-gray-500 mb-1">
                                  Asavio support replied · {ticket.respondedAt ? new Date(ticket.respondedAt).toLocaleDateString("en-GB") : ""}
                                </p>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.adminResponse}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 italic">Awaiting response from our team.</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          For urgent matters you can also email{" "}
          <a href="mailto:support@asavio.app" className="underline hover:text-black transition-colors">
            support@asavio.app
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense>
      <SupportContent />
    </Suspense>
  );
}
