"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Spin, Empty, message } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";
import OrderRatingCard from "@/components/reusable/OrderRatingCard";
import RatingList from "@/components/reusable/RatingList";
import CustomModal from "@/components/reusable/CustomModal"; // Sesuaikan path ini

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  createdAt: string;
  expiresAt: string;
  items: Array<{
    id: string;
    date: string;
    startHour: number;
    endHour: number;
    price: number;
    field: {
      id: string;
      name: string;
      venue: {
        id: string;
        name: string;
        vendorId: string;
      };
    };
  }>;
  payment?: {
    id: string;
    status: string;
    amount: number;
    qrCode: string;
    paidAt: string;
  };
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  PENDING: {
    bg: "bg-yellow-50",
    text: "text-yellow-500",
    label: "Menunggu pembayaran",
  },
  PAID: { bg: "bg-green-50", text: "text-green-500", label: "Lunas" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-500", label: "Dibatalkan" },
  REFUND_REQUESTED: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Refund diajukan",
  },
  REFUNDED: { bg: "bg-slate-100", text: "text-slate-500", label: "Direfund" },
  SUCCESS: { bg: "bg-green-50", text: "text-green-500", label: "Berhasil" },
};

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400">{icon}</span>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {children}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-500",
    label: status,
  };
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// Komponen Icon tetap sama (IconMapPin, IconGrid, IconCreditCard, IconCalendar, IconClock, IconStar, IconArrowLeft)
function IconMapPin() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconStar() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isInitialized } = useAuthStore();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refundModalOpen, setRefundModalOpen] = useState(false); // State untuk modal pembatalan

  const fetchOrder = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err: any) {
      message.error("Gagal mengambil data order");
      console.error(err);
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
    fetchOrder();
  }, [user, isInitialized]);

  const handleRequestRefund = async () => {
    try {
      await api.put(`/orders/${orderId}`, { action: "request-refund" });
      message.success(
        "Permintaan refund telah diajukan. Admin akan memproses dalam 1–2 hari kerja.",
      );
      setRefundModalOpen(false);
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Gagal mengajukan refund");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Empty description="Order tidak ditemukan" />
        <div className="text-center mt-4">
          <Button
            type="primary"
            onClick={() => router.push("/orders")}
            className="cursor-pointer">
            Kembali ke riwayat
          </Button>
        </div>
      </div>
    );
  }

  const venueName = order.items?.[0]?.field?.venue?.name || "Venue";
  const vendorId = order.items?.[0]?.field?.venue?.vendorId || "";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header Baru - Tombol Kembali dipaling atas */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/orders")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-4 w-fit">
          <IconArrowLeft />
          Kembali
        </button>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              Detail pesanan
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              #{order.id.slice(0, 8)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="space-y-4">
        {/* Venue Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <SectionLabel icon={<IconMapPin />}>Lokasi venue</SectionLabel>
          <p className="text-base font-semibold text-gray-900">{venueName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Vendor ID: {vendorId.slice(0, 8)}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <SectionLabel icon={<IconGrid />}>Detail lapangan</SectionLabel>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.field.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <IconCalendar />
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                      <IconClock />
                      {item.startHour}:00 – {item.endHour}:00 (
                      {item.endHour - item.startHour} jam)
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-purple-600">
                    Rp {item.price.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <SectionLabel icon={<IconCreditCard />}>
            Informasi pembayaran
          </SectionLabel>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total pembayaran</span>
              <span className="text-base font-semibold text-purple-600">
                Rp {order.totalAmount.toLocaleString("id-ID")}
              </span>
            </div>
            {order.payment && (
              <>
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Status pembayaran
                  </span>
                  <StatusBadge status={order.payment.status} />
                </div>
                {order.payment.paidAt && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Tanggal pembayaran</span>
                    <span className="text-gray-900">
                      {new Date(order.payment.paidAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                )}
                {order.status === "PENDING" && (
                  <button
                    onClick={() => router.push(`/payment/${order.id}`)}
                    className="mt-4 w-full py-3 rounded-xl bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 transition">
                    {order.payment?.status === "PENDING"
                      ? "Lanjutkan Pembayaran"
                      : "Bayar Sekarang"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Order Date */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <SectionLabel icon={<IconCalendar />}>Tanggal pesanan</SectionLabel>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Dipesan pada</span>
            <span className="text-gray-900">
              {new Date(order.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Cancel button */}
        {order.status === "PAID" && (
          <button
            onClick={() => setRefundModalOpen(true)}
            className="cursor-pointer w-full py-2.5 border border-red-200 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
            Ajukan pembatalan
          </button>
        )}

        {/* Rating Card */}
        {order.status === "PAID" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <OrderRatingCard
              order={order}
              onRatingSubmitted={() => {
                setRefreshKey((prev) => prev + 1);
                fetchOrder(false);
              }}
            />
          </div>
        )}

        {/* Rating List */}
        {order.status === "PAID" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <SectionLabel icon={<IconStar />}>
              Rating untuk vendor ini
            </SectionLabel>
            <RatingList
              key={refreshKey}
              vendorId={vendorId}
              isCurrentUserView={false}
            />
          </div>
        )}
      </div>

      {/* Modal Pembatalan dengan CustomModal */}
      <CustomModal
        open={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Konfirmasi Pembatalan"
        titleBorder={true}
        footer={
          <div className="flex gap-3 justify-end mt-4">
            <Button
              onClick={() => setRefundModalOpen(false)}
              className="cursor-pointer">
              Batal
            </Button>
            <Button
              type="primary"
              danger
              onClick={handleRequestRefund}
              className="cursor-pointer bg-red-500 hover:bg-red-600">
              Ya, Ajukan Pembatalan
            </Button>
          </div>
        }>
        <p className="text-gray-600 text-sm">
          Apakah Anda yakin ingin mengajukan pembatalan untuk pesanan ini?
          Pengembalian dana akan diproses sesuai dengan kebijakan yang berlaku.
        </p>
      </CustomModal>
    </div>
  );
}
