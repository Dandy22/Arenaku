"use client";

import { useState } from "react";
import { Modal, Button, message } from "antd";
import api from "@/lib/axios";

interface RatingFormProps {
  orderId: string;
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STAR_LABELS = [
  "",
  "Kurang sekali",
  "Kurang baik",
  "Cukup baik",
  "Baik",
  "Sangat baik!",
];

function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
  const fill = filled ? "#BA7517" : hovered ? "#FAC775" : "none";
  const stroke = filled || hovered ? "#BA7517" : "#D3D1C7";
  return (
    <svg
      width={36}
      height={36}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function RatingForm({
  orderId,
  vendorName,
  isOpen,
  onClose,
  onSuccess,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const activeVal = hovered || rating;

  const handleClose = () => {
    setRating(0);
    setHovered(0);
    setComment("");
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning("Silakan berikan rating bintang terlebih dahulu");
      return;
    }
    try {
      setLoading(true);
      await api.post("/ratings", { orderId, rating, comment });
      message.success("Rating berhasil dikirim!");
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal mengirim rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span className="text-base font-semibold text-gray-900">
          Beri rating untuk {vendorName}
        </span>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Batal
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          disabled={rating === 0}
          onClick={handleSubmit}>
          Kirim rating
        </Button>,
      ]}>
      <div className="mt-5 space-y-5">
        {/* Stars */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Rating Anda
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                aria-label={`${val} bintang`}
                className="transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHovered(val)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(val)}>
                <StarIcon
                  filled={val <= rating}
                  hovered={val <= hovered && val > rating}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-medium text-gray-600 min-w-[100px]">
              {STAR_LABELS[activeVal]}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Komentar{" "}
            <span className="normal-case font-normal text-gray-400">
              (opsional)
            </span>
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bagikan pengalaman Anda dengan venue ini..."
            maxLength={500}
            rows={4}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 resize-none outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {comment.length}/500
          </p>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-700 mb-1.5">
            Tips ulasan yang baik
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Berikan rating yang jujur sesuai pengalaman Anda
            </li>
            <li className="flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Komentar membantu vendor meningkatkan layanannya
            </li>
            <li className="flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Rating Anda akan dilihat oleh pelanggan lain
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
