"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tag, Button, message, Input } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";
import OrderRatingCard from "@/components/reusable/OrderRatingCard";
import CustomModal from "@/components/reusable/CustomModal";

type OrderPreview = {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  payment?: { status: string };
  vendorRating?: any; // 🔥 Tambahkan field ini agar tau kalau udah direview
  items?: Array<{
    id: string;
    date: string;
    startHour: number;
    endHour: number;
    field: {
      name: string;
      venue: {
        id: string;
        name: string;
        vendorId: string;
      };
    };
  }>;
  eventTickets?: Array<{
    id: string;
    quantity: number;
    event: { title: string };
  }>;
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [orders, setOrders] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 STATE REFUND
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // 🔥 Pastikan API /orders include vendorRating di backend
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetchOrders();
  }, [user, isInitialized, router, fetchOrders]);

  const statusLabel: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    PAID: "Lunas",
    CANCELLED: "Dibatalkan",
    REFUND_REQUESTED: "Pengajuan Refund",
    REFUNDED: "Refund Selesai",
  };

  const handleConfirmRefund = async () => {
    if (!refundOrderId) return;
    if (!refundReason.trim()) {
      message.error("Alasan pembatalan wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/orders/${refundOrderId}`, {
        action: "request-refund",
        cancelReason: refundReason, // 🔥 Kirim alasan ke backend
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === refundOrderId ? { ...o, status: "REFUND_REQUESTED" } : o,
        ),
      );

      message.success(
        "Permintaan refund telah diajukan. Admin akan memproses dalam 1-2 hari kerja.",
      );
      setRefundOrderId(null);
      setRefundReason(""); // Kosongkan form
    } catch (error: any) {
      message.error(
        error?.response?.data?.error ||
          error.message ||
          "Gagal mengajukan refund",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Riwayat Pesanan
      </h1>

      {loading ? (
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-100 rounded-2xl h-32 animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 text-xl">Belum ada pesanan</p>
          <button
            onClick={() => router.push("/venues")}
            className="cursor-pointer mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}>
            Cari Venue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const hasRated = !!order.vendorRating; // Cek apakah sudah di-review

            return (
              <div key={order.id} className="flex flex-col">
                <div
                  className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                  onClick={() => router.push(`/orders/${order.id}`)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono text-slate-400">
                      #{order.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Tag
                        className={`rounded-full px-3 py-1 font-medium border-0 ${
                          order.status === "PAID"
                            ? "!bg-green-50 !text-green-500"
                            : order.status === "PENDING"
                              ? "!bg-yellow-50 !text-yellow-600"
                              : order.status === "CANCELLED"
                                ? "!bg-red-50 !text-red-600"
                                : order.status === "REFUND_REQUESTED"
                                  ? "!bg-blue-50 !text-blue-600"
                                  : "!bg-slate-100 !text-slate-600"
                        }`}>
                        {statusLabel[order.status] || order.status}
                      </Tag>
                      {order.status === "PENDING" && !order.payment && (
                        <span className="text-sm text-yellow-500 font-medium">
                          Belum bayar
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ...(order.items || []).map((item) => ({
                        kind: "field",
                        ...item,
                      })),
                      ...(order.eventTickets || []).map((ticket) => ({
                        kind: "ticket",
                        ...ticket,
                      })),
                    ]
                      .slice(0, 2)
                      .map((item: any) =>
                        item.kind === "field" ? (
                          <div key={item.id}>
                            <p className="font-semibold text-slate-800">
                              {item.field?.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {new Date(item.date).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                              {" · "}
                              {item.startHour}:00 - {item.endHour}:00
                            </p>
                          </div>
                        ) : (
                          <div key={item.id}>
                            <p className="font-semibold text-slate-800">
                              {item.event?.title || "Tiket event"}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.quantity} tiket
                            </p>
                          </div>
                        ),
                      )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      {order.status === "PENDING" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/payment/${order.id}`);
                          }}
                          className="cursor-pointer px-3 py-1 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition">
                          {order.payment?.status === "PENDING"
                            ? "Lanjutkan Pembayaran"
                            : "Bayar Sekarang"}
                        </button>
                      )}

                      {/* 🔥 TOMBOL DIBUAT HILANG JIKA SUDAH DI-REVIEW */}
                      {order.status === "PAID" && !hasRated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRefundOrderId(order.id);
                          }}
                          className="cursor-pointer px-3 py-1 text-sm bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition">
                          Ajukan Pembatalan
                        </button>
                      )}
                      <span className="font-bold text-purple-700">
                        Rp. {order.totalAmount?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                {order.status === "PAID" && (
                  <div className="mt-3 px-1 mb-2">
                    <OrderRatingCard
                      order={order as any}
                      onRatingSubmitted={() => fetchOrders(false)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🔥 MODAL REFUND DENGAN INPUT ALASAN */}
      <CustomModal
        open={!!refundOrderId}
        onClose={() => {
          setRefundOrderId(null);
          setRefundReason(""); // Reset form pas ditutup
        }}
        title="Konfirmasi Pembatalan"
        titleBorder={true}
        footer={
          <div className="flex gap-3 justify-end mt-4">
            <Button
              onClick={() => {
                setRefundOrderId(null);
                setRefundReason("");
              }}
              className="cursor-pointer">
              Batal
            </Button>
            <Button
              type="primary"
              danger
              loading={isSubmitting}
              disabled={!refundReason.trim()} // 🔥 Disabled jika alasan kosong
              onClick={handleConfirmRefund}
              className="cursor-pointer bg-red-500 hover:bg-red-600 disabled:opacity-50">
              Ya, Ajukan Pembatalan
            </Button>
          </div>
        }>
        <div className="py-2">
          <p className="text-slate-600 text-sm mb-4">
            Apakah Anda yakin ingin mengajukan pembatalan untuk pesanan ini?
            Pengembalian dana akan diproses sesuai dengan kebijakan yang
            berlaku.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              Alasan Pembatalan <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              rows={4}
              placeholder="Contoh: Salah pilih tanggal, jadwal mendadak berubah..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="!rounded-xl"
            />
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
