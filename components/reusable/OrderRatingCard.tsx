"use client";

import { useEffect, useState } from "react";
import { message } from "antd";
import api from "@/lib/axios";
import RatingForm from "./RatingForm";

interface OrderRatingCardProps {
  order: {
    id: string;
    status: string;
    items: Array<{
      field: {
        venue: {
          id: string;
          name: string;
          vendorId: string;
        };
      };
    }>;
  };
  onRatingSubmitted?: () => void;
}

interface ExistingRating {
  id?: string;
  rating?: number;
  comment?: string;
  rated?: boolean; // New flag to indicate already rated
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#BA7517" : "none"}
          stroke="#BA7517"
          strokeWidth={1.5}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function OrderRatingCard({
  order,
  onRatingSubmitted,
}: OrderRatingCardProps) {
  const [existingRating, setExistingRating] = useState<ExistingRating | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const venueName = order.items?.[0]?.field?.venue?.name || "Venue";
  const vendorId = order.items?.[0]?.field?.venue?.vendorId || "";

  useEffect(() => {
    if (order.status !== "PAID") {
      setLoading(false);
      return;
    }
    // Check if user can rate this order (includes checking for existing ratings)
    api
      .get(`/ratings/check?orderId=${order.id}`)
      .then((res) => {
        // If canRate is false, it means user already rated or cannot rate
        setExistingRating(res.data.canRate ? null : { rated: true });
      })
      .catch((err) => {
        console.error("Error checking rating status:", err);
        // On error, assume cannot rate to be safe
        setExistingRating({ rated: true });
      })
      .finally(() => setLoading(false));
  }, [order.id, order.status]);

  if (order.status !== "PAID") return null;
  if (loading) return null;

  return (
    <>
      {existingRating ? (
        /* Already rated */
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg
              width={17}
              height={17}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3B6D11"
              strokeWidth={2}
              xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {existingRating.rated
                ? "Rating sudah diberikan"
                : "Ulasan sudah dikirim"}
            </p>
            {existingRating.rating && (
              <StarDisplay rating={existingRating.rating} />
            )}
            {existingRating.comment && (
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                {existingRating.comment}
              </p>
            )}
            {existingRating.rated && !existingRating.rating && (
              <p className="text-xs text-gray-500">
                Terima kasih atas feedback Anda untuk {venueName}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Not yet rated */
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg
                width={17}
                height={17}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#854F0B"
                strokeWidth={1.8}
                xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Beri penilaian
              </p>
              <p className="text-xs text-gray-500">
                Bagaimana pengalaman Anda di {venueName}?
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-primary cursor-pointer text-white text-xs font-semibold hover:bg-purple-800 transition-colors">
            Beri rating
          </button>
        </div>
      )}

      <RatingForm
        orderId={order.id}
        vendorName={venueName}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          setExistingRating({ rated: true }); // Mark as rated
          onRatingSubmitted?.();
        }}
      />
    </>
  );
}
