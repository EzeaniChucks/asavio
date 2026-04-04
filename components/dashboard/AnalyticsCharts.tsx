"use client";

// components/dashboard/AnalyticsCharts.tsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { HostAnalytics } from "@/types";
import { formatPrice } from "@/lib/formatPrice";

// Minimal SVG line chart — no external chart library needed
function LineChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  if (!data.length) return <p className="text-sm text-gray-400 text-center py-8">No revenue data yet.</p>;

  const W = 600;
  const H = 120;
  const PAD = { top: 10, right: 10, bottom: 24, left: 50 };

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const minVal = 0;

  const xStep = (W - PAD.left - PAD.right) / Math.max(data.length - 1, 1);
  const yRange = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (v: number) => PAD.top + yRange - ((v - minVal) / (maxVal - minVal)) * yRange;

  const points = data.map((d, i) => `${toX(i)},${toY(d.revenue)}`).join(" ");
  const fillPoints = [
    `${toX(0)},${H - PAD.bottom}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.revenue)}`),
    `${toX(data.length - 1)},${H - PAD.bottom}`,
  ].join(" ");

  // Show ~5 evenly-spaced x-axis labels
  const labelInterval = Math.max(1, Math.floor(data.length / 5));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32">
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((frac) => {
        const val = frac * maxVal;
        const y = toY(val);
        return (
          <g key={frac}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {formatPrice(val)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <polygon points={fillPoints} fill="#000" opacity="0.05" />

      {/* Line */}
      <polyline points={points} fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={toX(i)} cy={toY(d.revenue)} r="3" fill="#000" />
      ))}

      {/* X labels */}
      {data.map((d, i) =>
        i % labelInterval === 0 ? (
          <text key={i} x={toX(i)} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default function AnalyticsCharts() {
  const [data, setData] = useState<HostAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get("/properties/analytics")
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total revenue (all time)", value: formatPrice(data.totalRevenue) },
    { label: "Total property views", value: data.totalViews.toLocaleString() },
    { label: "Total bookings", value: data.totalBookings.toLocaleString() },
    { label: "Conversion rate", value: `${data.conversionRate.toFixed(2)}%` },
  ];

  return (
    <div className="space-y-8">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue — last 30 days</h3>
        <LineChart data={data.revenueByDay} />
      </div>

      {/* Top listings table */}
      {data.topListings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top performing listings</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Property</th>
                <th className="text-right px-5 py-3 font-medium">Revenue</th>
                <th className="text-right px-5 py-3 font-medium">Views</th>
                <th className="text-right px-5 py-3 font-medium">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {data.topListings.map((l, i) => (
                <tr key={l.propertyId} className={i < data.topListings.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">{l.title}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{formatPrice(l.revenue)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{l.views.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{l.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
