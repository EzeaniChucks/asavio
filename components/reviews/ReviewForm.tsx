"use client";

// components/reviews/ReviewForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaStar } from "react-icons/fa";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface ReviewFormProps {
  propertyId?: string;
  vehicleId?: string;
  onSuccess: () => void;
  redirectTo?: string;
}

export default function ReviewForm({ propertyId, vehicleId, onSuccess, redirectTo }: ReviewFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(redirectTo ?? window.location.pathname)}`);
      return;
    }
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (comment.trim().length < 10) { toast.error("Comment must be at least 10 characters"); return; }

    setIsSubmitting(true);
    try {
      await api.post("/reviews", { propertyId, vehicleId, rating, comment });
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      onSuccess();
    } catch {
      // error toast handled by axios interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Write a review</h3>

      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition-colors"
          >
            <FaStar className={(hover || rating) >= star ? "text-yellow-400" : "text-gray-200"} />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-sm text-gray-500 ml-2 self-center">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        rows={4}
        maxLength={1000}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black resize-none bg-white"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{comment.length}/1000</span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary py-2 px-6 text-sm disabled:opacity-50"
        >
          {isSubmitting ? "Submitting…" : isAuthenticated ? "Submit review" : "Log in to review"}
        </button>
      </div>
    </form>
  );
}
