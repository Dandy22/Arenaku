"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HiOutlineMapPin, HiOutlineClock } from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

const SPORT_CATEGORIES = [
  { label: "Semua", value: "", img: "https://images.unsplash.com/photo-1546519638405-a9e8a4a25f4b?w=100" },
  { label: "Mini Soccer", value: "MINI_SOCCER", img: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=100" },
  { label: "Sepak Bola", value: "FUTSAL", img: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=100" },
  { label: "Bulu Tangkis", value: "BADMINTON", img: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=100" },
  { label: "Basket", value: "BASKETBALL", img: "https://images.unsplash.com/photo-1546519638405-a9e8a4a25f4b?w=100" },
  { label: "Tenis", value: "TENNIS", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100" },
  { label: "Bola Voli", value: "VOLLEYBALL", img: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=100" },
  { label: "Padel", value: "PADEL", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100" },
];

function ActivityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [events, setEvents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [page, setPage] = useState(1);

  const fetchEvents = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (city) params.set("city", city);
      params.set("page", String(p));
      params.set("limit", "8");
      const res = await api.get(`/events?${params.toString()}`);
      setEvents(res.data.data || res.data);
      setMeta(res.data.meta || { total: res.data.length, page: 1, totalPages: 1 });
    } catch {
      console.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [category]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Aktivitas <span className="text-purple-600">Komunitas</span>
      </h1>

      {/* Sport category filter */}
      <div className="flex gap-4 overflow-x-auto pb-2 mb-8">
        {SPORT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => { setCategory(cat.value); setPage(1); }}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <div className={`w-16 h-16 rounded-full overflow-hidden border-4 transition ${
              category === cat.value ? "border-purple-600" : "border-transparent"
            }`}>
              <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
            </div>
            <span className={`text-xs font-medium ${category === cat.value ? "text-purple-600" : "text-gray-600"}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Header + Buat Aktivitas */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">Semua Aktivitas</p>
        {user?.role === "VENDOR" && (
          <Link
            href="/activity/create"
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
          >
            Buat Aktivitas
          </Link>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Belum ada event</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={event.imageUrl || "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400"}
                  alt={event.title}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
                  <p className="text-xs font-bold text-gray-800">
                    {new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm uppercase line-clamp-2">{event.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <HiOutlineClock size={12} />
                  {new Date(event.date).toLocaleDateString("id-ID", {
                    day: "numeric", month: "long", year: "numeric"
                  })}, {event.startHour}:00 PM
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <HiOutlineMapPin size={12} /> {event.city || event.location}
                </p>
                <Link
                  href={`/activity/${event.id}`}
                  className="mt-2 block text-center py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 transition"
                >
                  Pesan Tiket
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Tampilkan 8 / halaman · dari {meta.total} data
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPage(page - 1); fetchEvents(page - 1); }}
              disabled={page <= 1}
              className="text-sm text-gray-500 hover:text-purple-600 disabled:opacity-40"
            >
              ← Kembali
            </button>
            <button
              onClick={() => { setPage(page + 1); fetchEvents(page + 1); }}
              disabled={page >= meta.totalPages}
              className="text-sm text-purple-600 font-semibold hover:underline disabled:opacity-40"
            >
              Lanjut →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-gray-400">Memuat...</p></div>}>
      <ActivityContent />
    </Suspense>
  );
}