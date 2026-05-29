"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineTag,
} from "react-icons/hi2";
import { Select } from "antd";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS } from "@/lib/constants";
import EventCard from "@/components/reusable/EventCard";

// Kategori disesuaikan menggunakan asset SVG dari Landing Page
const SPORT_CATEGORIES = [
  { label: "Semua", value: "", img: "/Semua.svg" },
  { label: "Futsal", value: "FUTSAL", img: "/SepakBola.svg" },
  { label: "Bulu Tangkis", value: "BADMINTON", img: "/BuluTangkis.svg" },

  { label: "Mini Soccer", value: "MINI_SOCCER", img: "/MiniSoccer.svg" },
  { label: "Basket", value: "BASKETBALL", img: "/Basket.svg" },
  { label: "Tenis", value: "TENNIS", img: "/Tenis.svg" },
  { label: "Bola Voli", value: "VOLLEYBALL", img: "/Bola Voli.svg" },
  { label: "Padel", value: "PADEL", img: "/Padel.svg" },
];

const formatDisplayCategory = (val: string) => {
  if (!val) return "Semua Aktivitas";
  const cat = SPORT_CATEGORIES.find((c) => c.value === val);
  return cat ? `Aktivitas ${cat.label}` : "Aktivitas";
};

function ActivityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State baru untuk mengecek apakah komponen sudah di-render di client (Hydration fix)
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // States for filters
  const [name, setName] = useState(searchParams.get("name") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [eventType, setEventType] = useState(
    searchParams.get("eventType") || "",
  ); // Filter Turnamen/Olahraga
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const fetchEvents = async (
    p = page,
    override: {
      name?: string;
      category?: string;
      district?: string;
      eventType?: string;
    } = {},
  ) => {
    setLoading(true);
    try {
      const queryName = override.name ?? name;
      const queryCategory = override.category ?? category;
      const queryDistrict = override.district ?? district;
      const queryEventType = override.eventType ?? eventType;

      const params = new URLSearchParams();
      if (queryName) params.set("name", queryName);
      if (queryCategory) params.set("category", queryCategory);
      if (queryDistrict) params.set("district", queryDistrict);
      if (queryEventType) params.set("eventType", queryEventType);
      params.set("page", String(p));
      params.set("limit", "8");

      const res = await api.get(`/events?${params.toString()}`);

      let responseData = res.data?.data || res.data;
      let responseMeta = res.data?.meta || {
        total: Array.isArray(responseData) ? responseData.length : 0,
        page: p,
        limit: 8,
        totalPages: 1,
      };

      if (Number(responseMeta.total) === 0 || !Array.isArray(responseData)) {
        responseData = [];
        responseMeta.total = 0;
      }

      setEvents(responseData);
      setMeta(responseMeta);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
      setMeta({ total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set mounted ke true saat pertama kali masuk (client-side)
    setMounted(true);

    const nextName = searchParams.get("name") || "";
    const nextCategory = searchParams.get("category") || "";
    const nextDistrict = searchParams.get("district") || "";
    const nextEventType = searchParams.get("eventType") || "";
    const nextPage = Number(searchParams.get("page")) || 1;

    setName(nextName);
    setCategory(nextCategory);
    setDistrict(nextDistrict);
    setEventType(nextEventType);
    setPage(nextPage);

    fetchEvents(nextPage, {
      name: nextName,
      category: nextCategory,
      district: nextDistrict,
      eventType: nextEventType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = () => {
    setPage(1);
    fetchEvents(1, { name, category, district, eventType });

    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (category) params.set("category", category);
    if (district) params.set("district", district);
    if (eventType) params.set("eventType", eventType);
    router.push(`/activity?${params.toString()}`);
  };

  const handleCategorySelect = (catValue: string) => {
    setCategory(catValue);
    setPage(1);
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (catValue) params.set("category", catValue);
    if (district) params.set("district", district);
    if (eventType) params.set("eventType", eventType);
    router.push(`/activity?${params.toString()}`);

    fetchEvents(1, { category: catValue, name, district, eventType });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Title & Header Section (DITENGAH) */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {formatDisplayCategory(category)}{" "}
          <span className="text-purple-600">Komunitas</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Temukan teman main dan ikuti acara seru di sekitar{" "}
          <span className="text-purple-600 font-medium">
            {district || "Kota Bekasi"}
          </span>
        </p>
      </div>

      {/* Main Filter Bar (DI ATAS KATEGORI) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8">
        <input
          placeholder="Cari judul aktivitas atau komunitas..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition mb-4"
        />

        <div className="flex flex-col md:flex-row gap-3">
          {/* Select Kecamatan */}
          <div className="flex-1 min-w-[200px] h-[44px] border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineMapPin className="text-purple-500 shrink-0" />
            {mounted ? (
              <Select
                placeholder="Pilih Kecamatan"
                variant="borderless"
                className="flex-1 text-sm font-semibold cursor-pointer"
                value={district || undefined}
                onChange={(val) => setDistrict(val || "")}
                allowClear
                options={
                  BEKASI_DISTRICTS as unknown as {
                    label: string;
                    value: string;
                  }[]
                }
              />
            ) : (
              <div className="flex-1 text-sm text-gray-400"></div>
            )}
          </div>

          {/* Select Tipe Event (Turnamen / Olahraga) */}
          <div className="flex-1 min-w-[200px] h-[44px] border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineTag className="text-purple-500 shrink-0" />
            {mounted ? (
              <Select
                placeholder="Pilih Tipe Event"
                variant="borderless"
                className="flex-1 text-sm font-semibold cursor-pointer"
                value={eventType || undefined}
                onChange={(val) => setEventType(val || "")}
                allowClear
                options={[
                  { label: "Turnamen", value: "TOURNAMENT" },
                  { label: "Olahraga", value: "SPORTS" },
                ]}
              />
            ) : (
              <div className="flex-1 text-sm text-gray-400"></div>
            )}
          </div>

          {/* Tombol Cari */}
          <button
            onClick={handleSearch}
            className="px-8 h-[44px] cursor-pointer rounded-xl bg-[#EF4444] text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm hover:shadow">
            <HiOutlineMagnifyingGlass className="text-lg" />
            Cari Aktivitas
          </button>
        </div>
      </div>

      {/* Sport Category Filter (GAYA LANDING PAGE & JUSTIFY-BETWEEN) */}
      <div className="flex overflow-x-auto pb-6 mb-4 no-scrollbar px-2 gap-4 md:gap-0 justify-start md:justify-between w-full">
        {SPORT_CATEGORIES.map((cat) => {
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => handleCategorySelect(cat.value)}
              className="cursor-pointer group flex flex-col items-center gap-3 shrink-0 bg-transparent">
              <div
                className={`w-20 h-24 md:w-24 md:h-28 transition-all duration-300 shrink-0 bg-transparent ${
                  isActive
                    ? "scale-110 drop-shadow-xl"
                    : "group-hover:scale-105 drop-shadow-md"
                }`}>
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback jika gambar SVG tidak ditemukan
                    (e.target as HTMLImageElement).src = "/Semua.svg";
                  }}
                />
              </div>
              <span
                className={`text-sm md:text-base tracking-wide whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-purple-600 font-bold"
                    : "text-gray-500 font-medium group-hover:text-gray-800"
                }`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-4">
        Hasil pencarian:{" "}
        <span className="font-semibold">{meta.total} Aktivitas ditemukan</span>
      </p>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-[340px] animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-lg font-medium">
            Aktivitas tidak ditemukan
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Coba ubah kata kunci atau ganti filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="hidden sm:inline">Tampilkan</span>
            <span className="font-medium">8 / halaman</span>
            <span className="hidden sm:inline">dari {meta.total} data</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(page - 1);
                fetchEvents(page - 1);
              }}
              disabled={page <= 1}
              className="cursor-pointer text-sm text-gray-500 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Kembali
            </button>
            <span className="text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-md">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => {
                setPage(page + 1);
                fetchEvents(page + 1);
              }}
              disabled={page >= meta.totalPages}
              className="cursor-pointer text-sm text-purple-600 font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      }>
      <ActivityContent />
    </Suspense>
  );
}
