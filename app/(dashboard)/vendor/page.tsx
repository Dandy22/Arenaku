"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineBuildingOffice,
  HiOutlineClipboard,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
} from "react-icons/hi2";
import api from "@/lib/axios";

export default function VendorDashboardPage() {
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalFields: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, bookingsRes] = await Promise.all([
          api.get("/venues"),
          api.get("/vendor/bookings"),
        ]);

        const venues = venuesRes.data;
        const bookings = bookingsRes.data;

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cards = [
    {
      title: "Total Venue",
      value: stats.totalVenues,
      icon: <HiOutlineBuildingOffice size={24} />,
      color: "#7C3AED",
      bg: "#F3F0FF",
    },
    {
      title: "Total Lapangan",
      value: stats.totalFields,
      icon: <HiOutlineCalendar size={24} />,
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      title: "Total Booking",
      value: stats.totalBookings,
      icon: <HiOutlineClipboard size={24} />,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      title: "Total Revenue",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      icon: <HiOutlineCurrencyDollar size={24} />,
      color: "#D97706",
      bg: "#FFFBEB",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Vendor</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ringkasan aktivitas venue kamu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Booking Terbaru
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Memuat...</p>
        ) : recentBookings.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada booking masuk</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {b.field?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {b.startHour}:00 - {b.endHour}:00
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-700">
                    Rp {b.price?.toLocaleString("id-ID")}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      b.order?.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : b.order?.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                    }`}>
                    {b.order?.status || "PENDING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
