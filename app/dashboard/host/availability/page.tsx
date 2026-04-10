"use client";

// app/dashboard/host/availability/page.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FaSearch,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Property, Vehicle } from "@/types";
import toast from "react-hot-toast";

interface BlockedRange {
  from: string;
  to: string;
}

type ListingType = "property" | "vehicle";

interface ListingOption {
  id: string;
  label: string;
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
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const presetType = (searchParams.get("type") as ListingType | null) ?? "property";
  const presetId   = searchParams.get("id") ?? "";

  const isAdmin = !authLoading && user?.role === "admin";

  const [listingType, setListingType] = useState<ListingType>(presetType);

  // Host path — own listings only (small list, safe to load all at once)
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Admin path — search-driven; never bulk-loads all listings
  const [adminSearch, setAdminSearch] = useState("");
  const [adminResults, setAdminResults] = useState<ListingOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [selectedId, setSelectedId] = useState<string>("");
  const [listingLabel, setListingLabel] = useState<string>("");
  // Tracks last committed ID so we only wipe blocked dates on a real selection change
  const committedIdRef = useRef<string>("");

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

  // Host: load own listings once
  useEffect(() => {
    if (!user || user.role === "admin") return;
    api
      .get("/properties/mine")
      .then((res) => setProperties(res.data.data.properties ?? []))
      .catch(() => {});
    api
      .get("/vehicles/host/my")
      .then((res) => setVehicles(res.data.data.vehicles ?? []))
      .catch(() => {});
  }, [user]);

  // Admin: debounced search
  useEffect(() => {
    if (!isAdmin || !adminSearch.trim()) {
      setAdminResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const endpoint = listingType === "property" ? "/admin/properties" : "/admin/vehicles";
        const res = await api.get(endpoint, { params: { search: adminSearch.trim(), limit: 10 } });
        const data = res.data.data ?? res.data;
        const items: (Property | Vehicle)[] = listingType === "property"
          ? (data.properties ?? [])
          : (data.vehicles ?? []);
        setAdminResults(
          listingType === "property"
            ? items.map((p: any) => ({ id: p.id, label: p.title }))
            : items.map((v: any) => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }))
        );
        setShowResults(true);
      } catch {
        setAdminResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [adminSearch, listingType, isAdmin]);

  // Admin: when arriving with a presetId, resolve the label by fetching the listing directly
  useEffect(() => {
    if (!isAdmin || !presetId) return;
    selectListing(presetId);
  }, [isAdmin, presetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Host: listing options
  const listings: ListingOption[] = listingType === "property"
    ? properties.map((p) => ({ id: p.id, label: p.title }))
    : vehicles.map((v) => ({ id: v.id, label: `${v.year} ${v.make} ${v.model}` }));

  // Host: when listing type changes or listings load, pick the right selectedId
  useEffect(() => {
    if (isAdmin) return;
    const options = listingType === "property"
      ? properties.map((p) => p.id)
      : vehicles.map((v) => v.id);

    const match = presetId && options.includes(presetId)
      ? presetId
      : (options[0] ?? "");

    if (match !== committedIdRef.current) {
      committedIdRef.current = match;
      setSelectedId(match);
      setBlockedDates([]);
      setListingLabel("");
      setShowPicker(false);
    }
  }, [listingType, properties, vehicles, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load blocked dates whenever the selected listing changes
  useEffect(() => {
    if (!selectedId) return;
    setIsFetching(true);
    const endpoint = listingType === "property"
      ? `/properties/${selectedId}`
      : `/vehicles/${selectedId}`;
    api
      .get(endpoint)
      .then((res) => {
        const item = listingType === "property"
          ? res.data.data.property
          : res.data.data.vehicle;
        setBlockedDates(item.blockedDates ?? []);
        setListingLabel(
          listingType === "property"
            ? item.title
            : `${item.year} ${item.make} ${item.model}`
        );
      })
      .catch(() => setBlockedDates([]))
      .finally(() => setIsFetching(false));
  }, [selectedId, listingType]);

  /** Commit a listing selection (admin or host via dropdown change) */
  function selectListing(id: string) {
    if (id === committedIdRef.current) return;
    committedIdRef.current = id;
    setSelectedId(id);
    setBlockedDates([]);
    setListingLabel("");
    setShowPicker(false);
  }

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
    if (blockedDates.some((r) => r.from === from && r.to === to)) {
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
    if (!selectedId) return;
    setIsSaving(true);
    const endpoint = listingType === "property"
      ? `/properties/${selectedId}/blocked-dates`
      : `/vehicles/${selectedId}/blocked-dates`;
    try {
      await api.patch(endpoint, { blockedDates });
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

  const hasListings = isAdmin ? !!selectedId : listings.length > 0;
  const backHref = isAdmin ? "/dashboard/admin/properties" : "/dashboard/host";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={backHref}
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
              Block dates so guests can&apos;t book during those periods — useful when booked outside Asavio.
            </p>
          </div>
        </div>

        {/* Listing type toggle */}
        <div className="flex gap-2 mb-6">
          {(["property", "vehicle"] as ListingType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setListingType(type);
                if (isAdmin) {
                  setAdminSearch("");
                  setAdminResults([]);
                  setShowResults(false);
                  selectListing("");
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                listingType === type
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {type === "property" ? "Properties" : "Vehicles"}
            </button>
          ))}
        </div>

        {/* Admin: search to find a listing */}
        {isAdmin && (
          <div className="relative mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search {listingType === "property" ? "property" : "vehicle"}
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                onFocus={() => adminResults.length > 0 && setShowResults(true)}
                placeholder={`Type a ${listingType} name to search…`}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
              {isSearching && (
                <FaSpinner className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm animate-spin" />
              )}
            </div>
            {showResults && adminResults.length > 0 && (
              <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {adminResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        selectListing(r.id);
                        setAdminSearch(r.label);
                        setShowResults(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <span className="font-medium text-gray-900">{r.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.id.slice(0, 8)}…</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showResults && adminResults.length === 0 && !isSearching && adminSearch.trim() && (
              <p className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                No {listingType === "property" ? "properties" : "vehicles"} found.
              </p>
            )}
          </div>
        )}

        {/* Host: listing dropdown (own listings only) */}
        {!isAdmin && listings.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select {listingType === "property" ? "property" : "vehicle"}
            </label>
            <select
              value={selectedId}
              onChange={(e) => selectListing(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {!hasListings ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            {isAdmin ? (
              <p className="text-gray-400 text-sm">
                Search for a {listingType === "property" ? "property" : "vehicle"} above to manage its availability.
              </p>
            ) : (
              <>
                <p className="text-gray-500">
                  You have no {listingType === "property" ? "properties" : "vehicles"} yet.
                </p>
                <Link
                  href={listingType === "property" ? "/dashboard/host/properties/new" : "/dashboard/host/vehicles/new"}
                  className="btn-primary mt-4 inline-block"
                >
                  Add a {listingType === "property" ? "property" : "vehicle"}
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {isFetching ? (
              <div className="flex justify-center py-16">
                <FaSpinner className="text-2xl text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-gray-900">Blocked date ranges</h2>
                    {listingLabel && (
                      <p className="text-xs text-gray-400 mt-0.5">{listingLabel}</p>
                    )}
                  </div>
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
                            {listingType === "property" ? "night(s)" : "day(s)"} blocked
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
