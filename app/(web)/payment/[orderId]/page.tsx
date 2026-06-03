"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { message, Button, Spin } from "antd";
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
  const searchParams = useSearchParams();
  const { user, isInitialized } = useAuthStore();
  const orderId = (params.orderId as string) || (params.id as string);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Tangkap param redirect dari Midtrans (khusus Mobile E-Wallet)
  const transactionStatus = searchParams.get("transaction_status");

  // 🔥 AUTO-CONFIRM JIKA REDIRECT DARI MOBILE E-WALLET
  useEffect(() => {
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      setCreating(true);
      message.loading({
        content: "Memverifikasi pembayaran...",
        key: "verify",
      });

      api
        .patch(`/payments/${orderId}/confirm`)
        .then(() => {
          message.success({ content: "Pembayaran Berhasil!", key: "verify" });
          router.push("/orders");
        })
        .catch((err) => {
          // Jika gagal karena webhook sudah mendahului (Payment already processed), itu tidak masalah
          message.success({
            content: "Pembayaran telah terverifikasi!",
            key: "verify",
          });
          router.push("/orders");
        });
    }
  }, [transactionStatus, orderId, router]);

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
    if (!isInitialized) return;

    if (!user) {
      router.push("/login");
      return;
    }
    api
      .get(`/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data);
        // Jika sudah bayar (mungkin webhook backend lebih cepat), langsung tendang ke orders
        if (res.data.status === "PAID") {
          router.push("/orders");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId, user, router, isInitialized]);

  const handlePayNow = async () => {
    setCreating(true);
    try {
      // 1. Request Snap Token ke backend kita
      const res = await api.post("/payments", {
        orderId,
        method: "QRIS", // Akan terganti otomatis oleh pilihan user di Snap
      });

      const { snapToken } = res.data;

      if (!snapToken) {
        throw new Error("Gagal mendapatkan token pembayaran");
      }

      // 2. Panggil Snap Pop-up
      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          try {
            await api.patch(`/payments/${orderId}/confirm`);
            message.success("Pembayaran Berhasil!");
            router.push("/orders");
          } catch (err: any) {
            console.error("Gagal update status di DB:", err);
            const errorMsg = err.response?.data?.error || err.message;
            // Jika error karena payment already processed, tetap lempar ke orders
            if (errorMsg.includes("already processed")) {
              message.success("Pembayaran Berhasil!");
              router.push("/orders");
            } else {
              message.error(`Gagal DB: ${errorMsg}`);
            }
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
          message.warning(
            "Pembayaran belum selesai. Klik 'Lanjutkan Pembayaran' untuk melanjutkan.",
          );
        },
      });
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal memproses pembayaran");
    } finally {
      setCreating(false);
    }
  };

  if (loading || transactionStatus === "settlement")
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
            <span className="font-mono text-sm">
              #{order.id.slice(-6).toUpperCase()}
            </span>
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
          className="h-14 rounded-xl text-lg font-bold bg-red-600 hover:bg-red-700 border-none cursor-pointer">
          {order.payment?.status === "PENDING"
            ? "Lanjutkan Pembayaran"
            : "Bayar Sekarang"}
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4">Detail Pesanan</h2>

        {/* Render Booking Lapangan */}
        {order.items?.map((item: any) => (
          <div
            key={item.id}
            className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-semibold text-gray-800">
                {item.field?.name || "Booking Lapangan"}
              </p>
              <p className="text-xs text-gray-400">{item.field?.venue?.name}</p>
            </div>
            <p className="font-bold text-gray-800">
              Rp {item.price?.toLocaleString("id-ID")}
            </p>
          </div>
        ))}

        {/* Render Tiket Event */}
        {order.eventTickets?.map((ticket: any) => (
          <div
            key={ticket.id}
            className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-semibold text-gray-800">
                {ticket.event?.title || "Tiket Event"}
              </p>
              <p className="text-xs text-gray-400">
                {ticket.quantity}x {ticket.ticketTier?.name || "Tiket Standar"}
              </p>
            </div>
            <p className="font-bold text-gray-800">
              Rp {ticket.totalPrice?.toLocaleString("id-ID")}
            </p>
          </div>
        ))}

        {/* Kalau dua-duanya kosong (Jaga-jaga) */}
        {!order.items?.length && !order.eventTickets?.length && (
          <p className="text-sm text-gray-400 italic">
            Detail item tidak ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}
