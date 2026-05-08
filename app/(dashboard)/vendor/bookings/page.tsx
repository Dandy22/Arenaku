"use client";

import { useMemo, useEffect, useState } from "react";
import { message } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/axios";
import dayjs from "dayjs";
import DataTable from "@/components/reusable/DataTable";
import { useSearchParams } from "next/navigation";

interface Booking {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  price: number;
  createdAt: string;
  field: { name: string; venue: { name: string } };
  order: {
    id: string;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    payment?: {
      status: string;
      method: string;
      createdAt: string;
    };
  };
}

export default function VendorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Mengambil query pencarian langsung dari URL
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    api
      .get("/vendor/bookings")
      .then((res) => {
        // MENGURUTKAN DATA MASUK DARI YANG TERBARU KE TERLAMA (Berdasarkan waktu pembuatan)
        const sortedData = res.data.sort(
          (a: Booking, b: Booking) =>
            dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
        );
        setBookings(sortedData);
      })
      .catch(() => message.error("Gagal memuat data booking"))
      .finally(() => setLoading(false));
  }, []);

  // Fungsi Badge Status
  const statusBadge = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      PENDING: { text: "Pending", className: "text-yellow-600 bg-yellow-50" },
      PAID: { text: "Lunas", className: "text-green-500 bg-green-50" },
      SUCCESS: { text: "Berhasil", className: "text-green-500 bg-green-50" },
      CANCELLED: { text: "Batal", className: "text-red-500 bg-red-50" },
      FAILED: { text: "Gagal", className: "text-red-500 bg-red-50" },
      EXPIRED: { text: "Expired", className: "text-slate-500 bg-slate-100" },
    };

    const item = map[status?.toUpperCase()] || map.PENDING;

    return (
      <div
        className={`inline-flex items-center h-7 gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-wider ${item.className}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
        {item.text}
      </div>
    );
  };

  // LOGIKA PENCARIAN (Filtering)
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;

    const query = searchQuery.toLowerCase();
    return bookings.filter((item) => {
      return (
        item.order?.customerName?.toLowerCase().includes(query) ||
        item.order?.id?.toLowerCase().includes(query) ||
        item.field?.name?.toLowerCase().includes(query) ||
        item.field?.venue?.name?.toLowerCase().includes(query)
      );
    });
  }, [bookings, searchQuery]);

  const columns: ColumnsType<Booking> = [
    {
      title: "ID Order",
      key: "orderId",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500 uppercase">
          #{r.order?.id?.slice(-6) || "-"}
        </span>
      ),
    },
    {
      title: "Customer",
      key: "customerName",
      render: (_, r) => (
        <span className="font-semibold text-sm text-slate-500">
          {r.order?.customerName}
        </span>
      ),
    },
    {
      title: "No. Telepon",
      key: "phone",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500">
          {r.order?.customerPhone}
        </span>
      ),
    },
    {
      title: "Lapangan",
      key: "field",
      render: (_, r) => (
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {r.field?.name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {r.field?.venue?.name}
          </p>
        </div>
      ),
    },
    {
      title: "Tanggal Booking",
      key: "date",
      // MENAMBAHKAN SORTER UNTUK TANGGAL BOOKING
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500">
          {dayjs(r.date).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      title: "Jam Booking",
      key: "time",
      render: (_, r) => {
        const start = String(r.startHour).padStart(2, "0");
        const end = String(r.endHour).padStart(2, "0");

        return (
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span>{start}:00</span>
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              width="12px"
              height="12px"
              fill="currentColor"
              className="text-slate-400">
              <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z" />
            </svg>
            <span>{end}:00</span>
          </div>
        );
      },
    },
    {
      title: "Waktu Transaksi",
      key: "transactionTime",
      // MENAMBAHKAN SORTER JUGA PADA WAKTU TRANSAKSI (Opsional, tapi sangat direkomendasikan)
      sorter: (a, b) => {
        const timeA = a.order?.payment?.createdAt || a.createdAt;
        const timeB = b.order?.payment?.createdAt || b.createdAt;
        return dayjs(timeA).valueOf() - dayjs(timeB).valueOf();
      },
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-500">
            {dayjs(r.order?.payment?.createdAt || r.createdAt).format(
              "DD/MM/YY",
            )}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {dayjs(r.order?.payment?.createdAt || r.createdAt).format("HH:mm")}{" "}
            WIB
          </span>
        </div>
      ),
    },
    {
      title: "Metode",
      key: "paymentMethod",
      render: (_, r) => (
        <span className="text-sm font-semibold text-slate-500 uppercase">
          {r.order?.payment?.method?.replace(/_/g, " ") || "N/A"}
        </span>
      ),
    },
    {
      title: "Total Bayar",
      dataIndex: "price",
      key: "price",
      align: "right",
      // MENAMBAHKAN SORTER PADA HARGA
      sorter: (a, b) => a.price - b.price,
      render: (price) => (
        <span className="font-semibold text-sm text-slate-500">
          Rp {price?.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Status",
      key: "orderStatus",
      align: "center",
      render: (_, r) => statusBadge(r.order?.status),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Booking Masuk</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor semua pemesanan lapangan dan status pembayaran
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <DataTable
          columns={columns}
          dataSource={filteredBookings}
          isLoading={loading}
          showSearch
          searchPlaceholder="Cari nama customer, ID order, atau lapangan..."
        />
      </div>
    </div>
  );
}
