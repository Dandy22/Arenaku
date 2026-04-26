"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
} from "react-icons/hi2";
import api from "@/lib/axios";

const SPORT_TYPES = [
  { label: "Semua", value: "" },
  { label: "Futsal", value: "FUTSAL" },
  { label: "Badminton", value: "BADMINTON" },
  { label: "Mini Soccer", value: "MINI_SOCCER" },
  { label: "Basketball", value: "BASKETBALL" },
  { label: "Tennis", value: "TENNIS" },
  { label: "Volleyball", value: "VOLLEYBALL" },
  { label: "Padel", value: "PADEL" },
];

function VenuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [venues, setVenues] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [date, setDate] = useState(
    searchParams.get("date") || new Date().toISOString().split("T")[0],
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const fetchVenues = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (city) params.set("city", city);
      if (type) params.set("type", type);
      params.set("page", String(p));
      params.set("limit", "8");

      const res = await api.get(`/venues?${params.toString()}`);
      if (res.data.data) {
        setVenues(res.data.data);
        setMeta(res.data.meta);
      } else {
        setVenues(res.data);
      }
    } catch {
      console.error("Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchVenues(1);
  };

  const getMinPrice = (fields: any[]) => {
    if (!fields?.length) return 0;
    return Math.min(...fields.map((f) => f.price));
  };

  const getAvgRating = (ratings: any[]) => {
    if (!ratings?.length) return 0;
    return (
      ratings.reduce((a: number, r: any) => a + r.rating, 0) / ratings.length
    );
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={
          i < Math.round(rating) ? "text-purple-500" : "text-gray-300"
        }>
        ★
      </span>
    ));

  const todayLabel = new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Venue <span className="text-purple-600">{type || "Semua"}</span> di{" "}
          <span className="text-purple-600">{city || "Semua Kota"}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Berikut Venue{" "}
          <span className="text-purple-600">{type || "Semua"}</span> di{" "}
          <span className="text-purple-600">{city || "Semua Kota"}</span> yang
          sudah memenuhi standar kualitas terbaik
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-8">
        <input
          placeholder="Cari nama venue"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition mb-3"
        />
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl">
            <HiOutlineMapPin size={18} className="text-purple-500 shrink-0" />
            <input
              placeholder="Pilih Kota"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <div className="flex-1 flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl">
            <span className="text-purple-500 shrink-0">⚽</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 text-sm text-gray-700 outline-none bg-transparent">
              {SPORT_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl">
            <HiOutlineCalendar size={18} className="text-purple-500 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition"
            style={{ background: "#EF4444" }}>
            Cari Venue
          </button>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-4">
        Hasil pencarian:{" "}
        <span className="font-semibold">{meta.total} Venue tersedia</span>
      </p>

      {/* Venue Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-80 animate-pulse"
            />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Venue tidak ditemukan</p>
          <p className="text-gray-400 text-sm mt-1">
            Coba ubah filter pencarian
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={
                    venue.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400"
                  }
                  alt={venue.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3">
                <div className="flex text-sm mb-1">
                  {renderStars(getAvgRating(venue.ratings))}
                </div>
                <h3 className="font-bold text-gray-900 text-sm uppercase">
                  {venue.name}
                </h3>
                <p className="text-xs text-purple-600 font-medium mt-0.5">
                  🏠 {venue.fields?.[0]?.type || "Olahraga"} ·{" "}
                  <span className="font-semibold">
                    {venue.fields?.length || 0} Lapangan
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <HiOutlineMapPin size={12} /> {venue.city}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  Harga mulai{" "}
                  <span className="text-purple-600 font-bold">
                    Rp. {getMinPrice(venue.fields)?.toLocaleString("id-ID")}
                  </span>
                </p>

                {/* First field slot preview */}
                {venue.fields?.[0] && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-700">
                      {venue.fields[0].name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {venue.fields[0].type} · P {venue.fields[0].length} x L{" "}
                      {venue.fields[0].width}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
                        <span
                          key={h}
                          className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {String(h).padStart(2, "0")}:00
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/venues/${venue.id}`}
                  className="mt-3 block text-center py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 transition">
                  Lihat Lebih Selengkapnya
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Tampilkan</span>
            <span className="font-medium">8 / halaman</span>
            <span>dari {meta.total} data</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPage(page - 1);
                fetchVenues(page - 1);
              }}
              disabled={page <= 1}
              className="text-sm text-gray-500 hover:text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Kembali
            </button>
            <span className="text-sm text-gray-500">
              {page} / {meta.totalPages}
            </span>
            <button
              onClick={() => {
                setPage(page + 1);
                fetchVenues(page + 1);
              }}
              disabled={page >= meta.totalPages}
              className="text-sm text-purple-600 font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
              Lanjut →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Memuat...</p>
        </div>
      }>
      <VenuesContent />
    </Suspense>
  );
}
