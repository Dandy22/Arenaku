"use client";

import { useEffect, useState } from "react";
import { Rate, Spin, Empty } from "antd";
import api from "@/lib/axios";

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

interface RatingDisplayProps {
  vendorId: string;
}

export default function RatingDisplay({ vendorId }: RatingDisplayProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/ratings/stats/${vendorId}`);
        setStats(res.data.data);
      } catch (err) {
        console.error("Error fetching rating stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spin />
      </div>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <div className="text-center py-8">
        <Empty description="Belum ada rating" />
        <p className="text-gray-500 text-sm mt-2">
          Jadilah yang pertama memberi rating untuk vendor ini
        </p>
      </div>
    );
  }

  const ratingPercentages: { [key: number]: number } = {};
  Object.keys(stats.ratingDistribution).forEach((key) => {
    const numKey = parseInt(key) as keyof typeof stats.ratingDistribution;
    const count = stats.ratingDistribution[numKey];
    ratingPercentages[numKey] = Math.round((count / stats.totalRatings) * 100);
  });

  return (
    <div className="space-y-6">
      {/* Average Rating Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-700">
              {stats.averageRating.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">dari 5</p>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Rate
                value={Math.round(stats.averageRating)}
                disabled
                style={{ fontSize: 20, color: "#FFB800" }}
              />
            </div>
            <p className="text-sm text-gray-700 font-semibold">
              Berdasarkan {stats.totalRatings} rating
            </p>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">Distribusi Rating</h3>

        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating];
          const percentage = ratingPercentages[rating];

          return (
            <div key={rating} className="flex items-center gap-3">
              {/* PERBAIKAN DI SINI: Lebar kontainer dinaikkan (w-20) dan diletakkan rata kanan */}
              <div className="w-20 flex items-center justify-end">
                <div className="flex gap-0.5 text-yellow-400 text-sm">
                  {Array.from({ length: rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>

              {/* Progress bar container (flex-1 agar mengisi sisa ruang) */}
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden flex-shrink-0">
                <div
                  className="bg-yellow-400 h-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count and Percentage label */}
              <div className="w-16 text-right">
                <p className="text-sm font-semibold text-gray-700">
                  {count}{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    ({percentage}%)
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <span className="font-semibold">💡 Insight: </span>
          {stats.averageRating >= 4.5
            ? "Vendor ini sangat direkomendasikan dengan rating yang sangat tinggi!"
            : stats.averageRating >= 3.5
              ? "Vendor ini cukup baik. Banyak pelanggan puas dengan layanannya."
              : stats.averageRating >= 2.5
                ? "Vendor ini memiliki rating sedang. Ada ruang untuk improvement."
                : "Rating vendor ini masih rendah. Pertimbangkan untuk mencari alternatif lain."}
        </p>
      </div>
    </div>
  );
}
