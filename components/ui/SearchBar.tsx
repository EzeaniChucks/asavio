// components/ui/SearchBar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function SearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [guests, setGuests] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location,
      guests: guests.toString(),
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    });
    router.push(`/search?${params.toString()}`);
  };

  const formatDateRange = () => {
    const start = dateRange.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const end = dateRange.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return start === end ? start : `${start} – ${end}`;
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
      {/* ── Desktop: single pill row ── */}
      <div className="hidden md:flex bg-white rounded-full shadow-2xl overflow-visible">
        {/* Location */}
        <div className="flex-1 flex items-center gap-2 px-5 py-3 border-r border-gray-200">
          <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full outline-none bg-transparent text-gray-900 placeholder-gray-400 text-sm"
          />
        </div>

        {/* Dates */}
        <div className="relative flex-1 flex items-center gap-2 px-5 py-3 border-r border-gray-200">
          <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full text-left text-sm text-gray-900 whitespace-nowrap"
          >
            {formatDateRange()}
          </button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 z-50 shadow-xl rounded-2xl overflow-hidden">
              <DateRange
                ranges={[dateRange]}
                onChange={(item: any) => setDateRange(item.selection)}
                minDate={new Date()}
                rangeColors={["#000"]}
              />
            </div>
          )}
        </div>

        {/* Guests */}
        <div className="flex items-center gap-2 px-5 py-3">
          <FaUser className="text-gray-400 flex-shrink-0" />
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="outline-none bg-transparent cursor-pointer text-sm text-gray-900"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="bg-black text-white rounded-full px-8 py-3 font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 my-1.5 mr-1.5"
        >
          <FaSearch className="text-sm" />
          Search
        </button>
      </div>

      {/* ── Mobile: stacked card ── */}
      <div className="md:hidden bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Location */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Where are you going?"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 text-sm min-w-0"
          />
        </div>

        {/* Dates */}
        <div className="relative border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <FaCalendarAlt className="text-gray-400 flex-shrink-0" />
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex-1 text-left text-sm text-gray-900"
            >
              {formatDateRange()}
            </button>
          </div>
          {showDatePicker && (
            <div className="z-50 w-full overflow-x-auto">
              <DateRange
                ranges={[dateRange]}
                onChange={(item: any) => setDateRange(item.selection)}
                minDate={new Date()}
                rangeColors={["#000"]}
                months={1}
                direction="vertical"
              />
            </div>
          )}
        </div>

        {/* Guests */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <FaUser className="text-gray-400 flex-shrink-0" />
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="flex-1 outline-none bg-transparent cursor-pointer text-sm text-gray-900"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full bg-black text-white py-4 font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <FaSearch />
          Search
        </button>
      </div>
    </form>
  );
}
