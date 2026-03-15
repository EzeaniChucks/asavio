"use client";

// app/dashboard/admin/payouts/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaMoneyBillWave, FaCheckCircle, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transferring, setTransferring] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api
      .get("/payouts/pending")
      .then((res) => setBookings(res.data.data.bookings))
      .catch(() => toast.error("Could not load pending payouts"))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleTransfer = async (bookingId: string) => {
    if (!confirm("Initiate payout to host for this booking?")) return;
    setTransferring(bookingId);
    try {
      const res = await api.post(`/payouts/${bookingId}/transfer`);
      const updated: Booking = res.data.data.booking;
      setBookings((prev) => prev.filter((b) => b.id !== updated.id));
      toast.success("Payout transferred successfully");
    } catch {
      // interceptor shows toast
    } finally {
      setTransferring(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending payouts</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bookings that are paid but host payout hasn&apos;t been transferred yet.
            </p>
          </div>
          <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1.5 rounded-full">
            {bookings.length} pending
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FaCheckCircle className="text-4xl text-green-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">All payouts are up to date</p>
            <p className="text-sm text-gray-400 mt-1">No pending host payouts at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const nights = Math.ceil(
                (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const isProcessing = transferring === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row gap-4"
                >
                  {/* Property image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {booking.property?.images?.[0]?.url ? (
                      <Image
                        src={booking.property.images[0].url}
                        alt={booking.property.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 truncate">
                          {booking.property?.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.user?.firstName} {booking.user?.lastName}
                          {" · "}
                          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                          {" · "}
                          {nights} {nights === 1 ? "night" : "nights"}
                        </p>
                      </div>

                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        booking.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Amounts */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs">Total paid</span>
                        <p className="font-semibold text-gray-900">
                          ₦{Number(booking.totalPrice).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Commission</span>
                        <p className="font-medium text-gray-600">
                          − ₦{Number(booking.platformCommission).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Host payout</span>
                        <p className="font-bold text-gray-900">
                          ₦{Number(booking.hostPayout).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Host bank check */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/admin/bookings/${booking.id}`}
                        className="text-xs text-gray-500 underline hover:text-black"
                      >
                        View booking
                      </Link>

                      <button
                        onClick={() => handleTransfer(booking.id)}
                        disabled={!!transferring}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Transferring…
                          </>
                        ) : (
                          <>
                            <FaMoneyBillWave />
                            Transfer ₦{Number(booking.hostPayout).toLocaleString()}
                          </>
                        )}
                      </button>

                      {!booking.user?.paystackRecipientCode && (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <FaExclamationCircle />
                          Host has no bank account set up
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
