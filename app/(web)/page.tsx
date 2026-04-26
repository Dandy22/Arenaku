"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import api from "@/lib/axios";

const SPORT_CATEGORIES = [
  { label: "Semua", value: "", icon: "🏅" },
  { label: "Mini Soccer", value: "MINI_SOCCER", icon: "⚽" },
  { label: "Sepak Bola", value: "FUTSAL", icon: "🥅" },
  { label: "Bulu Tangkis", value: "BADMINTON", icon: "🏸" },
  { label: "Basket", value: "BASKETBALL", icon: "🏀" },
  { label: "Tenis", value: "TENNIS", icon: "🎾" },
  { label: "Bola Voli", value: "VOLLEYBALL", icon: "🏐" },
  { label: "Padel", value: "PADEL", icon: "🎾" },
];

export default function HomePage() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchDate, setSearchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/venues?limit=4"), api.get("/events?limit=4")])
      .then(([venuesRes, eventsRes]) => {
        setVenues(venuesRes.data.data || venuesRes.data);
        setEvents(eventsRes.data.data || eventsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchCity) params.set("city", searchCity);
    if (searchType) params.set("type", searchType);
    if (searchDate) params.set("date", searchDate);
    router.push(`/venues?${params.toString()}`);
  };

  const formatPrice = (price: number) =>
    `Rp. ${price?.toLocaleString("id-ID")}`;

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={
          i < Math.round(rating) ? "text-purple-500" : "text-gray-300"
        }>
        ★
      </span>
    ));
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
        <img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1400"
          alt="hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Main Lebih Seru di Venue Terbaik!
          </h1>
          <p className="mt-2 text-lg md:text-xl text-white/80">
            Temukan Lapangan Favoritmu Sekarang
          </p>
        </div>
      </section>

      {/* Search bar */}
      <section className="relative z-30 -mt-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #5B21B6, #9333EA)" }}>
            <p className="text-white text-center text-sm font-medium py-3">
              Temukan Lapangan Favoritmu Sekarang
            </p>
            <div className="bg-white/10 backdrop-blur-sm px-4 pb-4">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <HiOutlineMapPin
                    size={18}
                    className="text-purple-500 shrink-0"
                  />
                  <input
                    placeholder="Pilih Kota"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                  />
                </div>
                <div className="flex-1 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <span className="text-purple-500 text-lg shrink-0">⚽</span>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent">
                    <option value="">Pilih Olahraga</option>
                    {SPORT_CATEGORIES.slice(1).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 bg-white rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <HiOutlineCalendar
                    size={18}
                    className="text-purple-500 shrink-0"
                  />
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "#EF4444" }}>
                  Cek Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rekomendasi Venue */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Rekomendasi <span className="text-purple-600">Venue</span>
          </h2>
          <Link
            href="/venues"
            className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1">
            Lihat lebih lanjut →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-72 animate-pulse"
              />
            ))}
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
                      {formatPrice(getMinPrice(venue.fields))}
                    </span>
                  </p>
                  <Link
                    href={`/venues/${venue.id}`}
                    className="mt-2 block text-center py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 transition">
                    Lihat Lebih Selengkapnya
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aktivitas Komunitas */}
      <section
        className="mt-16"
        style={{
          background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
        }}>
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Aktivitas Komunitas
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {SPORT_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/activity?category=${cat.value}`}
                className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl hover:bg-white/30 transition">
                  {cat.icon}
                </div>
                <span className="text-white text-xs font-medium">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Acara Komunitas */}
      <section className="max-w-7xl mx-auto px-6 mt-12 mb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Acara <span className="text-purple-600">Komunitas</span>
          </h2>
          <Link
            href="/activity"
            className="text-sm text-purple-600 font-semibold hover:underline">
            Lihat lebih lanjut →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={
                      event.imageUrl ||
                      "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400"
                    }
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-2 py-1 text-center">
                    <p className="text-xs font-bold text-gray-800">
                      {new Date(event.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm uppercase line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    🕐{" "}
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    , {event.startHour}:00 PM
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <HiOutlineMapPin size={12} /> {event.city || event.location}
                  </p>
                  <Link
                    href={`/activity/${event.id}`}
                    className="mt-2 block text-center py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:border-purple-500 hover:text-purple-600 transition">
                    Pesan Tiket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
