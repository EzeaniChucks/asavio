"use client";

// app/dashboard/host/kyc/page.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle, FaClock, FaTimesCircle, FaUpload, FaIdCard } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const DOCUMENT_TYPES = [
  { value: "national_id", label: "National ID Card" },
  { value: "voters_card", label: "Voter's Card" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "international_passport", label: "International Passport" },
  { value: "nin_slip", label: "NIN Slip" },
] as const;

type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";

interface KycState {
  kycStatus: KycStatus;
  kycDocumentType: string | null;
  kycSubmittedAt: string | null;
  kycReviewedAt: string | null;
  kycRejectionReason: string | null;
}

const STATUS_CONFIG: Record<KycStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  not_submitted: {
    icon: <FaIdCard className="text-gray-500" />,
    label: "Not submitted",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200",
  },
  pending: {
    icon: <FaClock className="text-amber-500" />,
    label: "Under review",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  approved: {
    icon: <FaCheckCircle className="text-green-500" />,
    label: "Verified",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  rejected: {
    icon: <FaTimesCircle className="text-red-500" />,
    label: "Not approved",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

export default function HostKycPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [kyc, setKyc] = useState<KycState | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const [documentType, setDocumentType] = useState<typeof DOCUMENT_TYPES[number]["value"]>(DOCUMENT_TYPES[0].value);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/kyc/status")
      .then((res) => setKyc(res.data.data))
      .catch(() => setKyc(null))
      .finally(() => setIsFetching(false));
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    setFile(chosen);
    setPreview(URL.createObjectURL(chosen));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a document image");

    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("document", file);

    setIsSubmitting(true);
    try {
      await api.post("/kyc/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Documents submitted for review");
      // Refresh status
      const res = await api.get("/kyc/status");
      setKyc(res.data.data);
      setFile(null);
      setPreview(null);
    } catch {
      // interceptor handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  const status = kyc?.kycStatus ?? "not_submitted";
  const cfg = STATUS_CONFIG[status];
  const canResubmit = status === "not_submitted" || status === "rejected";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/dashboard/host"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-6 transition-colors"
        >
          <FaArrowLeft />
          Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Identity Verification</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Verify your identity to make your listings discoverable to guests.
          </p>

          {/* Status banner */}
          <div className={`flex items-start gap-3 rounded-xl border p-4 mb-6 ${cfg.bg}`}>
            <span className="text-lg mt-0.5">{cfg.icon}</span>
            <div>
              <p className={`font-semibold ${cfg.color}`}>
                KYC Status: {cfg.label}
              </p>
              {status === "pending" && (
                <p className="text-sm text-amber-600 mt-0.5">
                  Your documents are being reviewed. This usually takes 1–2 business days.
                </p>
              )}
              {status === "approved" && (
                <p className="text-sm text-green-600 mt-0.5">
                  Your identity is verified. Your listings are visible to guests.
                </p>
              )}
              {status === "rejected" && kyc?.kycRejectionReason && (
                <p className="text-sm text-red-600 mt-0.5">
                  Reason: {kyc.kycRejectionReason}
                </p>
              )}
              {status === "not_submitted" && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Submit your ID to unlock hosting. Your listings will be hidden until approved.
                </p>
              )}
              {kyc?.kycSubmittedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Submitted:{" "}
                  {new Date(kyc.kycSubmittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Accepted documents info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">Accepted documents</p>
            <ul className="space-y-1">
              {DOCUMENT_TYPES.map((d) => (
                <li key={d.value} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {d.label}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-400">
              Upload a clear, legible image of your document (JPEG, PNG or WebP, max 5 MB).
            </p>
          </div>

          {/* Upload form — only shown when not pending/approved */}
          {canResubmit && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as typeof DOCUMENT_TYPES[number]["value"])}

                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File upload area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document image
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Document preview"
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FaUpload className="text-2xl" />
                      <p className="text-sm">Click to upload document</p>
                      <p className="text-xs">JPEG, PNG or WebP · max 5 MB</p>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file && (
                  <p className="text-xs text-gray-500 mt-1.5">{file.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || isSubmitting}
                className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting…" : status === "rejected" ? "Re-submit documents" : "Submit for verification"}
              </button>
            </form>
          )}

          {status === "pending" && (
            <p className="text-center text-sm text-gray-400 mt-2">
              You can re-submit if you need to update your documents after a rejection.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
