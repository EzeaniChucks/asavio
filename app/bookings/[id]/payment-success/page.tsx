"use client";

// app/bookings/[id]/payment-success/page.tsx
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import { api } from "@/lib/api";
import { Suspense } from "react";

type VerifyState = "loading" | "success" | "failed" | "error";

function PaymentSuccessContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const [state, setState] = useState<VerifyState>("loading");

  useEffect(() => {
    if (!reference) {
      setState("error");
      return;
    }

    api
      .get(`/payments/verify/${reference}`)
      .then((res) => {
        const paymentStatus = res.data.data.booking?.paymentStatus;
        setState(paymentStatus === "paid" ? "success" : "failed");
      })
      .catch(() => setState("error"));
  }, [reference]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-md w-full text-center"
        >
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful!</h1>
          <p className="text-gray-500 mb-8">
            Your booking is confirmed. A confirmation email is on its way.
          </p>
          {reference && (
            <p className="text-xs text-gray-400 font-mono mb-6">Ref: {reference}</p>
          )}
          <Link
            href={`/bookings/${id}`}
            className="block w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            View booking
          </Link>
        </motion.div>
      </div>
    );
  }

  // failed or error
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-md w-full text-center"
      >
        <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {state === "failed" ? "Payment failed" : "Something went wrong"}
        </h1>
        <p className="text-gray-500 mb-8">
          {state === "failed"
            ? "Your payment was not completed. You can try again from your booking."
            : "We couldn't verify your payment. If you were charged, please contact support."}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/bookings/${id}`}
            className="block w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Back to booking
          </Link>
          <button
            onClick={() => router.push(`/bookings/${id}`)}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            Try paying again from the booking page
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
