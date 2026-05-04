"use client";

import { useEffect, useState } from "react";
import { Table, Select, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  HiOutlineBuildingOffice,
  HiOutlineClipboard,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import dayjs from "dayjs"; // Tambahan import dayjs agar format tanggal sama

type PeriodType = "today" | "week" | "month";

interface TransactionData {
  date: string;
  amount: number;
  count: number;
}

interface VendorProfileData {
  status: string;
  bankAccountNumber: string | null;
}

// Fungsi Badge Status (Sama persis dengan Bookings Page)
const getStatusBadge = (status: string) => {
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
      <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {item.text}
    </div>
  );
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalFields: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UNTUK VENDOR PROFILE & BANNER ---
  const [vendorProfile, setVendorProfile] = useState<VendorProfileData | null>(
    null,
  );

  // --- STATE GRAFIK ---
  const [period, setPeriod] = useState<PeriodType>("week");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [allBookings, setAllBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, bookingsRes, profileRes] = await Promise.all([
          api.get("/venues"),
          api.get("/vendor/bookings"),
          api.get("/vendor/profile"),
        ]);

        const venues = venuesRes.data;
        const bookings = bookingsRes.data;

        if (profileRes.data && profileRes.data.vendor) {
          setVendorProfile(profileRes.data.vendor);
        }

        setAllBookings(bookings);

        const totalFields = venues.reduce(
          (acc: number, v: any) => acc + (v.fields?.length || 0),
          0,
        );
        const totalRevenue = bookings
          .filter((b: any) => b.order?.status === "PAID")
          .reduce((acc: number, b: any) => acc + (b.price || 0), 0);

        setStats({
          totalVenues: venues.length,
          totalFields,
          totalBookings: bookings.length,
          totalRevenue,
        });

        setRecentBookings(bookings.slice(0, 5));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- LOGIKA FILTER GRAFIK TRANSAKSI ---
  useEffect(() => {
    if (allBookings.length === 0) return;

    const now = new Date();
    let startDate: Date;
    let dateFormat: Intl.DateTimeFormat;

    switch (period) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        dateFormat = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        dateFormat = new Intl.DateTimeFormat("id-ID", {
          weekday: "short",
          day: "numeric",
        });
        break;
      case "month":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        dateFormat = new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
        });
        break;
    }

    const validOrders = allBookings.filter((b: any) => {
      const orderDate = new Date(b.order?.createdAt || b.date);
      return orderDate >= startDate && b.order?.status === "PAID";
    });

    const grouped: Record<string, { amount: number; count: number }> = {};

    validOrders.forEach((b: any) => {
      const dateKey = dateFormat.format(new Date(b.order?.createdAt || b.date));
      if (!grouped[dateKey]) {
        grouped[dateKey] = { amount: 0, count: 0 };
      }
      grouped[dateKey].amount += b.price || 0;
      grouped[dateKey].count += 1;
    });

    const transactionData = Object.entries(grouped).map(([date, data]) => ({
      date,
      amount: data.amount,
      count: data.count,
    }));

    if (period !== "today") {
      transactionData.sort((a, b) => {
        return 1;
      });
    }

    setTransactions(transactionData);
    setFilteredRevenue(
      validOrders.reduce((sum: number, b: any) => sum + (b.price || 0), 0),
    );
  }, [period, allBookings]);

  const cards = [
    {
      title: "Total Venue",
      value: stats.totalVenues,
      icon: <HiOutlineBuildingOffice size={22} />,
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      title: "Total Lapangan",
      value: stats.totalFields,
      icon: <HiOutlineCalendar size={22} />,
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      title: "Total Booking",
      value: stats.totalBookings,
      icon: <HiOutlineClipboard size={22} />,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      title: "Total Pendapatan",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      icon: <HiOutlineCurrencyDollar size={22} />,
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  // --- COLUMNS UPDATE: Disamakan dengan halaman VendorBookingsPage ---
  const columns: ColumnsType<any> = [
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
      title: "Total Bayar",
      dataIndex: "price",
      key: "price",
      align: "right",
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
      render: (_, r) => getStatusBadge(r.order?.status),
    },
  ];

  // --- LOGIKA TAMPILAN BANNER DASHBOARD ---
  const renderBanner = () => {
    if (loading || !vendorProfile) return null;

    if (vendorProfile.status === "VERIFIED") return null;

    if (
      vendorProfile.status === "PENDING" &&
      !vendorProfile.bankAccountNumber
    ) {
      return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-blue-50 border border-blue-100 p-5 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-blue-100 text-blue-500 rounded-full p-2 shrink-0">
              <HiOutlineInformationCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-700">
                Pemberitahuan Penting
              </h3>
              <p className="text-sm text-blue-600 mt-0.5">
                Anda wajib mengisi data rekening bank terlebih dahulu sebelum
                dapat membuat atau menambahkan Venue baru.
              </p>
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => router.push("/vendor/accounts/profile?tab=2")}
            className="!h-10 !rounded-full !bg-blue-500 hover:!bg-blue-600 !font-semibold !border-none shrink-0">
            Lengkapi Sekarang
          </Button>
        </div>
      );
    }

    if (
      vendorProfile.status === "PENDING" &&
      !!vendorProfile.bankAccountNumber
    ) {
      return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-amber-50 border border-amber-200 p-5 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-amber-100 text-amber-600 rounded-full p-2 shrink-0">
              <HiOutlineInformationCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800">
                Menunggu Verifikasi Admin
              </h3>
              <p className="text-sm text-amber-700 mt-0.5">
                Akun Anda dalam tahap peninjauan. Tunggu verifikasi dari admin
                agar dapat menambahkan Venue.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (vendorProfile.status === "REJECTED") {
      return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-red-50 border border-red-200 p-5 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-red-100 text-red-600 rounded-full p-2 shrink-0">
              <HiOutlineInformationCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-800">
                Verifikasi Ditolak
              </h3>
              <p className="text-sm text-red-700 mt-0.5">
                Mohon periksa kembali data Anda atau hubungi admin untuk
                informasi lebih lanjut.
              </p>
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => router.push("/vendor/accounts/profile?tab=2")}
            className="!h-10 !rounded-full !bg-red-500 hover:!bg-red-600 !font-semibold !border-none shrink-0">
            Perbaiki Data
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Vendor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan aktivitas dan performa venue kamu
          </p>
        </div>
      </div>

      {renderBanner()}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Grafik Pendapatan Lapangan
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Total pendapatan pada periode ini:{" "}
              <span className="font-semibold text-green-600">
                Rp {filteredRevenue.toLocaleString("id-ID")}
              </span>
            </p>
          </div>
          <Select
            value={period}
            onChange={setPeriod}
            className="w-40 mt-2 sm:mt-0 !h-10 [&_.ant-select-selector]:!rounded-full"
            options={[
              { value: "today", label: "Hari Ini" },
              { value: "week", label: "Minggu Ini" },
              { value: "month", label: "Bulan Ini" },
            ]}
          />
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={transactions}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <Legend verticalAlign="top" height={36} />
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={{ stroke: "#E5E7EB" }}
                tickFormatter={(value) => `Rp ${(value / 1000).toFixed(0)}rb`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                formatter={(value, name) => {
                  const numValue = typeof value === "number" ? value : 0;
                  if (name === "Jumlah Booking") {
                    return [numValue, "Jumlah Booking"];
                  }
                  return [
                    `Rp ${numValue.toLocaleString("id-ID")}`,
                    "Pendapatan",
                  ];
                }}
                labelStyle={{ color: "#374151", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#7C3AED"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
                name="Pendapatan"
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={0.1}
                fill="#10B981"
                name="Jumlah Booking"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada data transaksi pada periode ini</p>
          </div>
        )}
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Booking Terbaru</h2>
          {/* Tombol Lihat Semua menuju halaman Booking Masuk */}
          <Button
            type="link"
            className="text-purple-600 font-semibold hover:text-purple-700"
            onClick={() => router.push("/vendor/bookings")}>
            Lihat Semua
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={recentBookings}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: "max-content" }}
          className="custom-scrollbar"
        />
      </div>
    </div>
  );
}
