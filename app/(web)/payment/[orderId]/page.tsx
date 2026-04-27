"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Select } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

const PAYMENT_METHODS = [
  { label: "QRIS Payment", value: "QRIS", group: "E-Wallet" },
  { label: "GoPay", value: "GOPAY", group: "E-Wallet" },
  { label: "OVO", value: "OVO", group: "E-Wallet" },
  { label: "Bank Transfer BCA", value: "BCA", group: "Bank Transfer" },
  { label: "Bank Transfer Mandiri", value: "MANDIRI", group: "Bank Transfer" },
];

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [method, setMethod] = useState("QRIS");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<"form" | "qr">("form");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get(`/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        if (res.data.payment) {
          setPayment(res.data.payment);
          setStep("qr");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCreatePayment = async () => {
    setCreating(true);
    try {
      const res = await api.post("/payments", { orderId, method });
      setPayment(res.data);
      setStep("qr");
      message.success("Payment berhasil dibuat! Scan QR untuk membayar.");
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal membuat payment");
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await api.patch(`/payments/${orderId}/confirm`);
      message.success("Pembayaran berhasil dikonfirmasi!");
      router.push("/orders");
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal konfirmasi");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
    </div>
  );

  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Payment</h1>

      {step === "form" ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Customer Detail */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Customer Detail</h2>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Customer Name</p>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                    {order.customerName}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Customer Phone Number</p>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                    {order.customerPhone}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                  {order.customerEmail}
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="w-full md:w-64 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4">Pilih Jenis Pembayaran</h2>
            <p className="text-xs text-gray-500 mb-2">E-Wallet</p>
            <Select
              value={method}
              onChange={setMethod}
              style={{ width: "100%" }}
              options={PAYMENT_METHODS.map((m) => ({ label: m.label, value: m.value }))}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* QR Code */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm w-80">
            <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="text-xs font-bold text-gray-600">QRIS QR Code Standar</span>
                <span className="text-xs font-bold text-red-600">GPN</span>
              </div>
              <p className="text-sm font-bold text-gray-800 mb-1">Nama Merchant {order.customerName}</p>
              <p className="text-xs text-gray-500 mb-1">NMID: XXXXXXXXXXXXX</p>
              <p className="text-xs text-gray-500 mb-4">TID</p>
              {/* QR placeholder */}
              <div className="w-40 h-40 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center mb-4">
                <div className="grid grid-cols-5 gap-0.5">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className={`w-6 h-6 ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs font-bold text-gray-700">SATU QRIS UNTUK SEMUA</p>
              <p className="text-xs text-gray-500">Cek aplikasi penyelenggara</p>
              <p className="text-xs text-gray-500">di: www.aspi-qris.id</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-gray-700">Total: <span className="text-purple-700">Rp. {order.totalAmount?.toLocaleString("id-ID")}</span></p>
            <p className="text-xs text-gray-500 mt-1">Metode: {method}</p>
          </div>
        </div>
      )}

      {/* Order detail */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Detail Pesanan</h2>
        {order.items?.map((item: any) => (
          <div key={item.id} className="grid grid-cols-2 gap-4 text-sm pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div>
              <p className="text-xs text-gray-400">Nama Venue</p>
              <p className="font-semibold text-gray-800">{item.field?.venue?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tanggal</p>
              <p className="font-semibold text-gray-800">
                {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Nama Lapangan</p>
              <p className="font-semibold text-gray-800">{item.field?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Subtotal</p>
              <p className="font-semibold text-gray-800">Rp. {item.price?.toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Jam</p>
              <p className="font-semibold text-gray-800">
                {String(item.startHour).padStart(2, "0")}:00 - {String(item.endHour).padStart(2, "0")}:00
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="max-w-3xl mx-auto">
          {step === "form" ? (
            <button
              onClick={handleCreatePayment}
              disabled={creating}
              className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
            >
              {creating ? "Memproses..." : "KONFIRMASI PEMESANAN"}
            </button>
          ) : (
            <button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="w-full py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
            >
              {confirming ? "Memproses..." : "KONFIRMASI PEMBAYARAN"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}