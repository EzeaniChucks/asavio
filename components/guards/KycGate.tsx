"use client";

// components/guards/KycGate.tsx
// Wraps "new listing" pages — blocks the form unless the host has submitted KYC.
// Shows a clear CTA to the KYC page. Admins bypass.

import Link from "next/link";
import { FaShieldAlt, FaArrowRight, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

interface KycGateProps {
  /** Label used in the banner copy — "property", "vehicle", "hotel", "event center" */
  listingNoun: string;
  children: React.ReactNode;
}

export default function KycGate({ listingNoun, children }: KycGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admins bypass (backend does the same)
  if (user?.role === "admin") return <>{children}</>;

  const status = user?.kycStatus ?? "not_submitted";

  // pending and approved both pass — host can prep the listing while KYC is reviewed
  if (status === "pending" || status === "approved") return <>{children}</>;

  // not_submitted or rejected — block
  const isRejected = status === "rejected";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
        {isRejected ? (
          <FaExclamationTriangle className="text-amber-500 text-2xl" />
        ) : (
          <FaShieldAlt className="text-amber-500 text-2xl" />
        )}
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-2">
        {isRejected
          ? "Resubmit your identity verification"
          : `Verify your identity to list a ${listingNoun}`}
      </h1>

      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
        {isRejected ? (
          <>
            Your previous KYC submission was rejected. Please review the reason in your
            KYC page, correct the issue, and resubmit your documents before creating a
            new {listingNoun}.
          </>
        ) : (
          <>
            For the safety of guests and hosts, Asavio requires every host to complete
            identity verification (KYC) before listing. It only takes a few minutes —
            you&apos;ll need a government-issued ID.
          </>
        )}
      </p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">What happens next</p>
        <p>1. Submit your KYC documents (takes ~2 minutes)</p>
        <p>2. You can start creating your listing while KYC is being reviewed</p>
        <p>3. Your listing goes live once both KYC and the listing itself are approved</p>
      </div>

      <Link
        href="/dashboard/host/kyc"
        className="inline-flex items-center gap-2 bg-black text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
      >
        {isRejected ? "Resubmit KYC" : "Submit KYC now"}
        <FaArrowRight className="text-xs" />
      </Link>
    </div>
  );
}
