"use client";

// components/reviews/ReviewList.tsx
import { FaStar, FaTrash } from "react-icons/fa";
import { Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface ReviewListProps {
  reviews: Review[];
  onDelete?: (id: string) => void;
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewList({ reviews, onDelete }: ReviewListProps) {
  const { user } = useAuth();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      onDelete?.(id);
    } catch {
      // interceptor handles toast
    }
  };

  if (reviews.length === 0) {
    return <p className="text-gray-400 text-sm">No reviews yet.</p>;
  }

  return (
    <div className="space-y-5">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700 flex-shrink-0">
            {review.user?.firstName?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">
                  {review.user?.firstName} {review.user?.lastName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar
                        key={s}
                        className={`text-xs ${review.rating >= s ? "text-yellow-400" : "text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(review.createdAt)}</span>
                </div>
              </div>
              {(user?.id === review.userId || user?.role === "admin") && onDelete && (
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  title="Delete review"
                >
                  <FaTrash className="text-xs" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
