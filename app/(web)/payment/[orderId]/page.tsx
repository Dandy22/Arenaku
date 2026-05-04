"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Select, Button, Spin } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

declare global {
  interface Window {
    snap: any;
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load Midtrans Snap Script
  useEffect(() => {
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js"; // Ganti ke app.midtrans.com jika production
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    let script = document.querySelector(
      `script[src="${midtransScriptUrl}"]`,
    ) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.src = midtransScriptUrl;
      script.setAttribute("data-client-key", clientKey);
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .get(`/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        // Jika sudah bayar, langsung tendang ke halaman sukses/orders
        if (res.data.status === "PAID") {
          router.push("/orders");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId, user, router]);

  const handlePayNow = async () => {
    setCreating(true);
    try {
      // 1. Request Snap Token ke backend kita
      const res = await api.post("/payments", {
        orderId,
        method: "QRIS",
      });

      const { snapToken } = res.data;

      if (!snapToken) {
        throw new Error("Gagal mendapatkan token pembayaran");
      }

      // 2. Panggil Snap Pop-up
      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          try {
            // Karena foldermu namanya 'confirm', panggil dengan akhiran /confirm
            await api.patch(`/payments/${orderId}/confirm`);

            message.success("Pembayaran Berhasil!");
            router.push("/orders");
          } catch (err: any) {
            console.error("Gagal update status di DB:", err);
            const errorMsg = err.response?.data?.error || err.message;
            message.error(`Gagal DB: ${errorMsg}`);
          }
        },
        onPending: (result: any) => {
          message.info("Menunggu pembayaran...");
          router.push("/orders");
        },
        onError: (result: any) => {
          message.error("Pembayaran Gagal!");
        },
        onClose: () => {
          message.warning("Anda menutup jendela pembayaran sebelum selesai.");
        },
      });
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal memproses pembayaran");
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  if (!order) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
        Checkout
      </h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center mb-6">
        <p className="text-gray-500 mb-2">Total yang harus dibayar</p>
        <h2 className="text-4xl font-extrabold text-purple-700 mb-6">
          Rp {order.totalAmount?.toLocaleString("id-ID")}
        </h2>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-block text-left w-full max-w-md">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-sm">Order ID:</span>
            <span className="font-mono text-sm">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Customer:</span>
            <span className="font-semibold text-sm">{order.customerName}</span>
          </div>
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={handlePayNow}
          loading={creating}
          className="h-14 rounded-xl text-lg font-bold bg-red-600 hover:bg-red-700 border-none">
          BAYAR SEKARANG
        </Button>
      </div>

      {/* Detail Pesanan tetap tampil di bawah */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Detail Pesanan</h2>
        {order.items?.map((item: any) => (
          <div
            key={item.id}
            className="flex justify-between items-center py-3 border-b last:border-0">
            <div>
              <p className="font-semibold">{item.field?.name}</p>
              <p className="text-xs text-gray-400">{item.field?.venue?.name}</p>
            </div>
            <p className="font-bold">
              Rp {item.price?.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
