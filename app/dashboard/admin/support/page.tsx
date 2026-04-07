"use client";

// app/dashboard/admin/support/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaInbox,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSpinner,
  FaEnvelope,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketCategory = "payment" | "booking" | "listing" | "account" | "other";

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: TicketCategory;
  message: string;
  status: TicketStatus;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  user?: { email: string; firstName: string; lastName: string };
}

type StatusFilter = "all" | TicketStatus;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const STATUS_STYLE: Record<TicketStatus, string> = {
  open:        "bg-red-100 text-red-700",
  in_progress: "bg-orange-100 text-orange-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100 text-gray-500",
};

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  payment: "Payment",
  booking: "Booking",
  listing: "Listing",
  account: "Account",
  other:   "Other",
};

export default function AdminSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<StatusFilter>("open");
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<TicketStatus>("resolved");
  const [submitting, setSubmitting] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setIsLoading(true);
    try {
      const statusParam = tab !== "all" ? `&status=${tab}` : "";
      const res = await api.get(`/admin/support?page=${page}&limit=${LIMIT}${statusParam}`);
      setTickets(res.data.data.tickets);
      setTotal(res.data.data.total);
    } catch {
      // interceptor handles
    } finally {
      setIsLoading(false);
    }
  }, [user, page, tab]);

  useEffect(() => { load(); }, [load]);

  // Auto-open a ticket if ?ticket=id is in the URL
  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (!ticketId) return;
    api.get(`/admin/support/${ticketId}`)
      .then((res) => {
        setSelected(res.data.data.ticket);
        setNewStatus(res.data.data.ticket.status === "open" ? "resolved" : res.data.data.ticket.status);
      })
      .catch(() => {});
  }, [searchParams]);

  const openTicket = async (ticket: SupportTicket) => {
    try {
      const res = await api.get(`/admin/support/${ticket.id}`);
      setSelected(res.data.data.ticket);
      setResponse("");
      setNewStatus("resolved");
    } catch {
      // interceptor handles
    }
  };

  const handleRespond = async () => {
    if (!selected || !response.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/support/${selected.id}/respond`, {
        response: response.trim(),
        status: newStatus,
      });
      toast.success("Response sent to guest");
      setSelected(null);
      setResponse("");
      load();
    } catch {
      // interceptor handles
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusOnly = async (ticketId: string, status: TicketStatus) => {
    try {
      await api.patch(`/admin/support/${ticketId}/status`, { status });
      toast.success(`Ticket marked as ${status}`);
      if (selected?.id === ticketId) setSelected((t) => t ? { ...t, status } : null);
      load();
    } catch {
      // interceptor handles
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminPageGuard permission={P.MANAGE_SUPPORT}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/admin" className="text-gray-400 hover:text-black transition-colors">
              <FaArrowLeft />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Guest Support</h1>
              <p className="text-sm text-gray-500 mt-0.5">View and respond to guest complaints and platform issues</p>
            </div>
          </div>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Left: ticket list */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setTab(t.value); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      tab === t.value
                        ? "bg-black text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                  <FaInbox className="mx-auto text-3xl mb-3" />
                  No tickets for this filter.
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => openTicket(ticket)}
                      className={`w-full text-left bg-white rounded-2xl border p-4 hover:border-gray-300 transition-colors ${
                        selected?.id === ticket.id ? "border-black" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[ticket.status]}`}>
                              {ticket.status.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              {CATEGORY_LABEL[ticket.category]}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 truncate text-sm">{ticket.subject}</p>
                          <p className="text-xs text-gray-500 truncate">{ticket.user?.email ?? ticket.userId}</p>
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                          {new Date(ticket.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 transition-colors">
                      <FaChevronLeft className="text-xs" />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:border-gray-400 disabled:opacity-40 transition-colors">
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: ticket detail + response panel */}
            <div className="lg:w-[420px]">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 sticky top-6"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[selected.status]}`}>
                            {selected.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            {CATEGORY_LABEL[selected.category]}
                          </span>
                        </div>
                        <h2 className="font-semibold text-gray-900">{selected.subject}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {selected.user?.firstName} {selected.user?.lastName} · {selected.user?.email}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString("en-GB")}</p>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-black text-lg leading-none p-1">✕</button>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selected.message}
                    </div>

                    {selected.adminResponse && (
                      <div className="border-l-4 border-black pl-4">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Admin response</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.adminResponse}</p>
                        {selected.respondedAt && (
                          <p className="text-xs text-gray-400 mt-1">{new Date(selected.respondedAt).toLocaleString("en-GB")}</p>
                        )}
                      </div>
                    )}

                    {/* Quick status actions */}
                    <div className="flex gap-2 flex-wrap">
                      {(["in_progress", "resolved", "closed"] as TicketStatus[])
                        .filter((s) => s !== selected.status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusOnly(selected.id, s)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 text-gray-600 transition-colors"
                          >
                            Mark {s.replace("_", " ")}
                          </button>
                        ))}
                    </div>

                    {/* Response form */}
                    <div className="space-y-3 border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-700">Send a response to guest</p>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Type your response…"
                        rows={5}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
                      />
                      <div className="flex items-center gap-3">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                          className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black bg-white"
                        >
                          <option value="in_progress">Mark in progress</option>
                          <option value="resolved">Mark resolved</option>
                          <option value="closed">Mark closed</option>
                        </select>
                        <button
                          onClick={handleRespond}
                          disabled={submitting || !response.trim()}
                          className="flex-1 flex items-center justify-center gap-2 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                          {submitting ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
                          {submitting ? "Sending…" : "Send & save"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 sticky top-6"
                  >
                    <FaInbox className="mx-auto text-3xl mb-3" />
                    <p className="text-sm">Select a ticket to view and respond</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}
