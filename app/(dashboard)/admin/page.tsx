"use client";

import { useEffect, useState } from "react";
import { Statistic, Card, Select } from "antd";
import {
  HiOutlineUsers,
  HiOutlineBuildingOffice,
  HiOutlineClipboard,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/axios";

type PeriodType = "today" | "week" | "month";

interface TransactionData {
  date: string;
  amount: number;
  count: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalOrders: 0,
    pendingVendors: 0,
  });
  const [period, setPeriod] = useState<PeriodType>("week");
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("[AdminPage] Fetching stats...");
        const [usersRes, vendorsRes, ordersRes] = await Promise.all([
          api.get("/users"),
          api.get("/admin/vendors"),
          api.get("/admin/orders"),
        ]);

        console.log("[AdminPage] Stats fetched successfully");
        setStats({
          totalUsers: usersRes.data.length,
          totalVendors: vendorsRes.data.filter(
            (v: any) => v.status === "VERIFIED",
          ).length,
          totalOrders: ordersRes.data.length,
          pendingVendors: vendorsRes.data.filter(
            (v: any) => v.status === "PENDING",
          ).length,
        });
      } catch (err: any) {
        console.error(
          "[AdminPage] Error fetching stats:",
          err.response?.status,
          err.message,
        );
        console.error("[AdminPage] Error details:", err.response?.data);
      }
    };
    fetchStats();
  }, []);

  // Fetch transaction data based on period
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const ordersRes = await api.get("/admin/orders");
        const orders = ordersRes.data;

        // Get date range based on period
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

        // Filter and group orders by date
        const filteredOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startDate && order.status === "PAID";
        });

        // Group by date
        const grouped: Record<string, { amount: number; count: number }> = {};

        filteredOrders.forEach((order: any) => {
          const dateKey = dateFormat.format(new Date(order.createdAt));
          if (!grouped[dateKey]) {
            grouped[dateKey] = { amount: 0, count: 0 };
          }
          grouped[dateKey].amount += order.totalAmount || 0;
          grouped[dateKey].count += 1;
        });

        // Convert to array and sort by date
        const transactionData = Object.entries(grouped).map(([date, data]) => ({
          date,
          amount: data.amount,
          count: data.count,
        }));

        // Sort by date (for week/month)
        if (period !== "today") {
          transactionData.sort((a, b) => {
            const dateA = new Date(a.date.split("/").reverse().join("-"));
            const dateB = new Date(b.date.split("/").reverse().join("-"));
            return dateA.getTime() - dateB.getTime();
          });
        }

        setTransactions(transactionData);
        setTotalRevenue(
          filteredOrders.reduce(
            (sum: number, order: any) => sum + (order.totalAmount || 0),
            0,
          ),
        );
      } catch (err: any) {
        console.error(
          "[AdminPage] Error fetching transactions:",
          err.response?.status,
          err.message,
        );
      }
    };
    fetchTransactions();
  }, [period]);

  const cards = [
    {
      title: "Total User",
      value: stats.totalUsers,
      icon: <HiOutlineUsers size={24} />,
      color: "#7C3AED",
      bg: "#F3F0FF",
    },
    {
      title: "Vendor Aktif",
      value: stats.totalVendors,
      icon: <HiOutlineBuildingOffice size={24} />,
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      title: "Total Order",
      value: stats.totalOrders,
      icon: <HiOutlineClipboard size={24} />,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      title: "Vendor Pending",
      value: stats.pendingVendors,
      icon: <HiOutlineCurrencyDollar size={24} />,
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ringkasan data sistem Arenaku
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart Section */}
      <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Grafik Pendapatan
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Total pendapatan:{" "}
              <span className="font-semibold text-green-600">
                Rp {totalRevenue.toLocaleString("id-ID")}
              </span>
            </p>
          </div>
          <Select
            value={period}
            onChange={setPeriod}
            className="w-40 mt-2 sm:mt-0"
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
                formatter={(value) => {
                  const numValue = typeof value === "number" ? value : 0;
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
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada data transaksi pada periode ini</p>
          </div>
        )}
      </div>
    </div>
  );
}
