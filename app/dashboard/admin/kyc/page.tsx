"use client";

// app/dashboard/admin/kyc/page.tsx
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FaCheckCircle, FaTimesCircle, FaClock, FaIdCard, FaExternalLinkAlt, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

type KycStatus = "pending" | "approved" | "rejected";

interface KycSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: KycStatus;
  kycDocumentType: string;
  kycDocumentUrl: string;
  kycSubmittedAt: string;
  kycReviewedAt: string | null;
  kycRejectionReason: string | null;
}

const DOCUMENT_LABELS: Record<string, string> = {
  national_id: "National ID Card",
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  international_passport: "International Passport",
  nin_slip: "NIN Slip",
};

const STATUS_BADGE: Record<KycStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<KycStatus, React.ReactNode> = {
  pending: <FaClock className="text-amber-500" />,
  approved: <FaCheckCircle className="text-green-500" />,
  rejected: <FaTimesCircle className="text-red-500" />,
};

type FilterTab = "all" | KycStatus;

function AdminKycContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");

  // Review modal state
  const [reviewing, setReviewing] = useState<KycSubmission | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const fetchSubmissions = () => {
    api
      .get("/kyc")
      .then((res) => setSubmissions(res.data.data.submissions))
      .catch(() => setSubmissions([]))
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    if (user?.role === "admin") fetchSubmissions();
  }, [user]);

  // Auto-open a specific user's submission if ?userId= is in the URL
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && submissions.length > 0) {
      const found = submissions.find((s) => s.id === userId);
      if (found) {
        setReviewing(found);
        setDecision("approved");
        setRejectionReason("");
      }
    }
  }, [searchParams, submissions]);

  const handleReview = async () => {
    if (!reviewing) return;
    if (decision === "rejected" && !rejectionReason.trim()) {
      return toast.error("Please provide a rejection reason");
    }
    setIsSaving(true);
    try {
      await api.patch(`/kyc/${reviewing.id}/review`, {
        decision,
        rejectionReason: decision === "rejected" ? rejectionReason.trim() : undefined,
      });
      toast.success(decision === "approved" ? "Host verified!" : "KYC rejected");
      setReviewing(null);
      setRejectionReason("");
      fetchSubmissions();
    } catch {
      // interceptor handles toast
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = submissions.filter((s) =>
    tab === "all" ? true : s.kycStatus === tab
  );

  const pendingCount = submissions.filter((s) => s.kycStatus === "pending").length;

  if (authLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
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
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Host KYC Verification
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Review and approve host identity documents before their listings go live.
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(["pending", "all", "approved", "rejected"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {t === "all"
                ? `All (${submissions.length})`
                : t === "pending"
                ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}`
                : t === "approved"
                ? `Approved (${submissions.filter((s) => s.kycStatus === "approved").length})`
                : `Rejected (${submissions.filter((s) => s.kycStatus === "rejected").length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaIdCard className="text-gray-300 text-4xl mx-auto mb-3" />
            <p className="text-gray-500">No {tab === "all" ? "" : tab} submissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
              >
                {/* Document thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {sub.kycDocumentUrl ? (
                    <Image
                      src={sub.kycDocumentUrl}
                      alt="KYC document"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <FaIdCard className="text-2xl" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">
                      {sub.firstName} {sub.lastName}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_BADGE[sub.kycStatus]}`}
                    >
                      {STATUS_ICONS[sub.kycStatus]}
                      {sub.kycStatus.charAt(0).toUpperCase() + sub.kycStatus.slice(1)}
                    </span>
                    {sub.kycStatus === "pending" && (
                      <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full animate-pulse">
                        Action required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{sub.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {DOCUMENT_LABELS[sub.kycDocumentType] ?? sub.kycDocumentType} ·{" "}
                    Submitted{" "}
                    {new Date(sub.kycSubmittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {sub.kycRejectionReason && (
                    <p className="text-xs text-red-500 mt-0.5">
                      Rejection reason: {sub.kycRejectionReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View document */}
                  {sub.kycDocumentUrl && (
                    <a
                      href={sub.kycDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                      title="View document"
                    >
                      <FaExternalLinkAlt className="text-sm" />
                    </a>
                  )}

                  {sub.kycStatus === "pending" && (
                    <button
                      onClick={() => {
                        setReviewing(sub);
                        setDecision("approved");
                        setRejectionReason("");
                      }}
                      className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Review KYC — {reviewing.firstName} {reviewing.lastName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{reviewing.email}</p>

            {/* Document preview */}
            {reviewing.kycDocumentUrl && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-4">
                <Image
                  src={reviewing.kycDocumentUrl}
                  alt="KYC document"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <p className="text-sm text-gray-600 mb-4">
              <strong>Document type:</strong>{" "}
              {DOCUMENT_LABELS[reviewing.kycDocumentType] ?? reviewing.kycDocumentType}
            </p>

            {/* Decision */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDecision("approved")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  decision === "approved"
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-green-400"
                }`}
              >
                Approve
              </button>
              <button
                onClick={() => setDecision("rejected")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  decision === "rejected"
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-red-400"
                }`}
              >
                Reject
              </button>
            </div>

            {decision === "rejected" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Document image is blurry or unreadable"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={isSaving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                  decision === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSaving
                  ? "Saving…"
                  : decision === "approved"
                  ? "Approve host"
                  : "Reject & notify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminKycPage() {
  return (
    <AdminPageGuard permission={P.MANAGE_KYC}>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <AdminKycContent />
      </Suspense>
    </AdminPageGuard>
  );
}
