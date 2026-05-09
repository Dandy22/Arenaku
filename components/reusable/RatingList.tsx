"use client";

import { useEffect, useState } from "react";
import { Empty, Spin, Pagination, Button, message } from "antd";
import api from "@/lib/axios";

interface Rating {
  id: string;
  vendorId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
}

interface RatingListProps {
  vendorId?: string;
  userId?: string;
  isCurrentUserView?: boolean;
  onRatingDeleted?: () => void;
}

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#BA7517" : "none"}
          stroke="#BA7517"
          strokeWidth={1.5}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="ml-1.5 text-xs font-semibold text-gray-600">
        {rating}/5
      </span>
    </div>
  );
}

function Initials({ name }: { name?: string }) {
  const letters = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-semibold text-purple-700 flex-shrink-0">
      {letters}
    </div>
  );
}

const LIMIT = 10;

export default function RatingList({
  vendorId,
  userId,
  isCurrentUserView = false,
  onRatingDeleted,
}: RatingListProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editHovered, setEditHovered] = useState(0);
  const [editComment, setEditComment] = useState("");

  const fetchRatings = async (pageNum = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: LIMIT.toString(),
      });
      if (vendorId) params.append("vendorId", vendorId);
      if (userId) params.append("userId", userId);
      const res = await api.get(`/ratings?${params.toString()}`);
      setRatings(res.data.data);
      setTotal(res.data.pagination?.total || 0);
      setPage(pageNum);
    } catch {
      message.error("Gagal mengambil ulasan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [vendorId, userId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus ulasan ini?")) return;
    try {
      await api.delete(`/ratings/${id}`);
      message.success("Ulasan berhasil dihapus");
      fetchRatings(page);
      onRatingDeleted?.();
    } catch {
      message.error("Gagal menghapus ulasan");
    }
  };

  const openEdit = (r: Rating) => {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditComment(r.comment);
  };

  const handleUpdate = async (id: string) => {
    if (editRating === 0 && !editComment) {
      message.warning("Ubah minimal satu field");
      return;
    }
    try {
      await api.put(`/ratings/${id}`, {
        rating: editRating || undefined,
        comment: editComment || undefined,
      });
      message.success("Ulasan berhasil diperbarui");
      setEditingId(null);
      fetchRatings(page);
    } catch {
      message.error("Gagal memperbarui ulasan");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="py-10">
        <Empty description="Belum ada ulasan" />
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {ratings.map((r) =>
          editingId === r.id ? (
            /* Edit mode */
            <div key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    Edit ulasan
                  </p>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Tutup">
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Rating
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        aria-label={`${val} bintang`}
                        className="transition-transform hover:scale-110"
                        onMouseEnter={() => setEditHovered(val)}
                        onMouseLeave={() => setEditHovered(0)}
                        onClick={() => setEditRating(val)}>
                        <svg
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          fill={
                            val <= (editHovered || editRating)
                              ? "#BA7517"
                              : "none"
                          }
                          stroke="#BA7517"
                          strokeWidth={1.5}
                          xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Komentar
                  </p>
                  <textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 resize-none outline-none focus:border-purple-400 transition"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleUpdate(r.id)}>
                    Simpan
                  </Button>
                  <Button size="small" onClick={() => setEditingId(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Initials name={r.user?.name} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {r.user?.name || "Pengguna"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {isCurrentUserView && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEdit(r)}
                      className="text-gray-400 hover:text-blue-600 transition"
                      aria-label="Edit ulasan">
                      <svg
                        width={15}
                        height={15}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}>
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                      aria-label="Hapus ulasan">
                      <svg
                        width={15}
                        height={15}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}>
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <StarDisplay rating={r.rating} />
              </div>

              {r.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {r.comment}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      {total > LIMIT && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={page}
            total={total}
            pageSize={LIMIT}
            onChange={(p) => fetchRatings(p)}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
