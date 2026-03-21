"use client";

// app/dashboard/host/availability/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DateRange } from "react-date-range";
import type { RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import {
  FaArrowLeft,
  FaCalendarTimes,
  FaPlus,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Property } from "@/types";
import toast from "react-hot-toast";

interface BlockedRange {
  from: string;
  to: string;
}

function toYMD(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function HostAvailabilityPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [blockedDates, setBlockedDates] = useState<BlockedRange[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pickerSelection, setPickerSelection] = useState({
    startDate: today,
    endDate: today,
    key: "selection",
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin"))) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load host's properties
  useEffect(() => {
    if (!user) return;
    api
      .get("/properties/mine")
      .then((res) => {
        const props: Property[] = res.data.data.properties;
        setProperties(props);
        if (props.length > 0) setSelectedPropertyId(props[0].id);
      })
      .catch(() => {});
  }, [user]);

  // Load blocked dates when property selection changes
  useEffect(() => {
    if (!selectedPropertyId) return;
    setIsFetching(true);
    api
      .get(`/properties/${selectedPropertyId}/booked-dates`)
      .then((res) => {
        // booked-dates returns both real bookings and blocked ranges
        // The property's own blocked dates are what we manage; filter by
        // fetching the raw property to get blockedDates only
        return api.get(`/properties/${selectedPropertyId}`);
      })
      .then((res) => {
        setBlockedDates(res.data.data.property.blockedDates ?? []);
      })
      .catch(() => setBlockedDates([]))
      .finally(() => setIsFetching(false));
  }, [selectedPropertyId]);

  const handlePickerChange = (ranges: RangeKeyDict) => {
    const sel = ranges.selection;
    setPickerSelection({
      startDate: sel.startDate ?? today,
      endDate: sel.endDate ?? today,
      key: "selection",
    });
  };

  const addBlockedRange = () => {
    const from = toYMD(pickerSelection.startDate);
    const to = toYMD(pickerSelection.endDate);
    if (from === to) {
      toast.error("Select a range — start and end must be different days");
      return;
    }
    // Avoid duplicates
    const exists = blockedDates.some((r) => r.from === from && r.to === to);
    if (exists) {
      toast.error("This range is already blocked");
      return;
    }
    setBlockedDates((prev) => [...prev, { from, to }]);
    setShowPicker(false);
  };

  const removeBlockedRange = (idx: number) => {
    setBlockedDates((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveChanges = async () => {
    if (!selectedPropertyId) return;
    setIsSaving(true);
    try {
      await api.patch(`/properties/${selectedPropertyId}/blocked-dates`, { blockedDates });
      toast.success("Availability updated");
    } catch {
      // interceptor shows error toast
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/host"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaCalendarTimes className="text-gray-600" />
              Manage Availability
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Block specific date ranges so guests can&apos;t book during those periods.
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-500">You have no listings yet.</p>
            <Link href="/dashboard/host/properties/new" className="btn-primary mt-4 inline-block">
              Add a listing
            </Link>
          </div>
        ) : (
          <>
            {/* Property selector */}
            {properties.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select property
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isFetching ? (
              <div className="flex justify-center py-16">
                <FaSpinner className="text-2xl text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">Blocked date ranges</h2>
                  <button
                    onClick={() => setShowPicker((s) => !s)}
                    className="inline-flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <FaPlus className="text-xs" />
                    Block dates
                  </button>
                </div>

                {/* Date picker */}
                {showPicker && (
                  <div className="mb-5 border border-gray-200 rounded-2xl overflow-hidden">
                    <DateRange
                      ranges={[pickerSelection]}
                      onChange={handlePickerChange}
                      minDate={today}
                      months={2}
                      direction="horizontal"
                      showDateDisplay={false}
                      rangeColors={["#ef4444"]}
                    />
                    <div className="px-4 pb-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                      <p className="text-sm text-gray-500">
                        {toYMD(pickerSelection.startDate) !== toYMD(pickerSelection.endDate)
                          ? `${formatDisplay(toYMD(pickerSelection.startDate))} → ${formatDisplay(toYMD(pickerSelection.endDate))}`
                          : "Select a start and end date"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPicker(false)}
                          className="text-sm px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addBlockedRange}
                          className="text-sm px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                        >
                          Block this range
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocked ranges list */}
                {blockedDates.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No dates blocked. Guests can book any available dates.
                  </div>
                ) : (
                  <ul className="space-y-2 mb-5">
                    {blockedDates.map((range, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {formatDisplay(range.from)} → {formatDisplay(range.to)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Math.round(
                              (new Date(range.to).getTime() - new Date(range.from).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            night(s) blocked
                          </p>
                        </div>
                        <button
                          onClick={() => removeBlockedRange(i)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-100 transition-colors"
                          title="Remove"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
