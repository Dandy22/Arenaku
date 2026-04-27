"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/orders")
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const statusColor: Record<string, string> = {
    PENDING: "orange", PAID: "green", CANCELLED: "red"
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Pesanan</h1>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Belum ada pesanan</p>
          <button
            onClick={() => router.push("/venues")}
            className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
          >
            Cari Venue
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/payment/${order.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8)}</span>
                <div className="flex items-center gap-2">
                  <Tag color={statusColor[order.status]}>{order.status}</Tag>
                  {order.status === "PENDING" && !order.payment && (
                    <span className="text-xs text-orange-500 font-medium">Belum bayar</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {order.items?.slice(0, 2).map((item: any) => (
                  <div key={item.id}>
                    <p className="font-semibold text-gray-800">{item.field?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      {" · "}{item.startHour}:00 - {item.endHour}:00
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                <span className="font-bold text-purple-700">
                  Rp. {order.totalAmount?.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}