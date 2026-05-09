"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Button, message } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";
import OrderRatingCard from "@/components/reusable/OrderRatingCard";
import CustomModal from "@/components/reusable/CustomModal"; // Sesuaikan path ini

export default function OrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk melacak order mana yang ingin dibatalkan
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [user, isInitialized]);

  const statusColor: Record<string, string> = {
    PENDING: "yellow",
    PAID: "green",
    CANCELLED: "red",
    REFUND_REQUESTED: "blue",
    REFUNDED: "slate",
  };

  const handleConfirmRefund = async () => {
    if (!refundOrderId) return;
    try {
      await api.put(`/orders/${refundOrderId}`, { action: "request-refund" });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === refundOrderId ? { ...o, status: "REFUND_REQUESTED" } : o,
        ),
      );
      message.success(
        "Permintaan refund telah diajukan. Admin akan memproses dalam 1-2 hari kerja.",
      );
      setRefundOrderId(null);
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal mengajukan refund");
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
          <p className="text-slate-400 text-lg">Belum ada pesanan</p>
          <button
            onClick={() => router.push("/venues")}
            className="cursor-pointer mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}>
            Cari Venue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col">
              <div
                className="cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                onClick={() => router.push(`/orders/${order.id}`)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono text-slate-400">
                    #{order.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Tag color={statusColor[order.status]}>{order.status}</Tag>
                    {order.status === "PENDING" && !order.payment && (
                      <span className="text-sm text-yellow-500 font-medium">
                        Belum bayar
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {order.items?.slice(0, 2).map((item: any) => (
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
                  ))}
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
                        className="cursor-pointer px-3 py-1 text-sm bg-purple-500 text-white rounded-sm hover:bg-purple-700 transition">
                        {order.payment?.status === "PENDING"
                          ? "Lanjutkan Pembayaran"
                          : "Bayar Sekarang"}
                      </button>
                    )}
                    {order.status === "PAID" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Mencegah klik menyebar ke container rute
                          setRefundOrderId(order.id);
                        }}
                        className="cursor-pointer px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
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
                    order={order}
                    onRatingSubmitted={() => fetchOrders(false)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Pembatalan dengan CustomModal */}
      <CustomModal
        open={!!refundOrderId}
        onClose={() => setRefundOrderId(null)}
        title="Konfirmasi Pembatalan"
        titleBorder={true}
        footer={
          <div className="flex gap-3 justify-end mt-4">
            <Button
              onClick={() => setRefundOrderId(null)}
              className="cursor-pointer">
              Batal
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleConfirmRefund}
              className="cursor-pointer bg-red-500 hover:bg-red-600">
              Ya, Ajukan Pembatalan
            </Button>
          </div>
        }>
        <p className="text-slate-600 text-sm">
          Apakah Anda yakin ingin mengajukan pembatalan untuk pesanan ini?
          Pengembalian dana akan diproses sesuai dengan kebijakan yang berlaku.
        </p>
      </CustomModal>
    </div>
  );
}
