"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS, SPORT_TYPES } from "@/lib/constants";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";

import VenueCard from "@/components/reusable/VenueCard";

const formatDisplayType = (type: string) => {
  if (!type) return "Semua";
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function VenuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tambahkan state isMounted untuk mengatasi FOUC pada Ant Design
  const [isMounted, setIsMounted] = useState(false);

  const [venues, setVenues] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [district, setDistrict] = useState(
    searchParams.get("district") || searchParams.get("city") || "",
  );
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
      if (district) params.set("district", district);
      if (type) params.set("type", type);
      if (date) params.set("date", date);

      params.set("page", String(p));
      params.set("limit", "8");

      const res = await api.get(`/venues?${params.toString()}`);

      // Ambil data
      let responseData = res.data?.data || res.data;
      let responseMeta = res.data?.meta || {
        total: Array.isArray(responseData) ? responseData.length : 0,
        page: p,
        limit: 8,
        totalPages: 1,
      };

      if (Number(responseMeta.total) === 0 || !Array.isArray(responseData)) {
        responseData = []; // Paksa buang data 'hantu' dari backend
        responseMeta.total = 0;
      }

      setVenues(responseData);
      setMeta(responseMeta);
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      setVenues([]);
      setMeta({ total: 0, page: 1, limit: 8, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Set isMounted jadi true setelah render pertama di client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setName(searchParams.get("name") || "");
    setDistrict(searchParams.get("district") || searchParams.get("city") || "");
    setType(searchParams.get("type") || "");
    setDate(searchParams.get("date") || new Date().toISOString().split("T")[0]);
    setPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  useEffect(() => {
    fetchVenues();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1);
    fetchVenues(1);

    // Update URL agar bisa di-copy & dishare sesuai dengan hasil filter
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (district) params.set("district", district);
    if (type) params.set("type", type);
    if (date) params.set("date", date);
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Venue{" "}
          <span className="text-purple-600">{formatDisplayType(type)}</span> di{" "}
          <span className="text-purple-600">{district || "Kota Bekasi"}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Berikut Venue{" "}
          <span className="text-purple-600">
            {formatDisplayType(type || "Semua")}
          </span>{" "}
          di{" "}
          <span className="text-purple-600">{district || "Kota Bekasi"}</span>{" "}
          yang sudah memenuhi standar kualitas terbaik
        </p>
      </div>

      {/* Filter Bar - UI disamakan dengan HomePage */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-8">
        {/* Input Nama */}
        <input
          placeholder="Cari nama venue..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition mb-4"
        />

        <div className="flex flex-col md:flex-row gap-3">
          {/* Select Kecamatan */}
          <div className="flex-1 min-w-[200px] h-[44px]  !bg-none border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineMapPin className="text-purple-500 shrink-0" />
            {isMounted && (
              <Select
                placeholder="Pilih Kecamatan"
                variant="borderless"
                className="flex-1 text-sm font-semibold"
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
            )}
          </div>

          {/* Select Olahraga */}
          <div className="flex-1 min-w-[200px] h-[44px] !bg-none border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineTag className="text-purple-500 shrink-0" />
            {isMounted && (
              <Select
                placeholder="Pilih Olahraga"
                variant="borderless"
                className="flex-1 text-sm font-semibold"
                value={type || undefined}
                onChange={(val) => setType(val || "")}
                allowClear
                options={SPORT_TYPES as any}
              />
            )}
          </div>

          {/* Date Picker */}
          <div className="flex-1 min-w-[200px] h-[44px]  !bg-none border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineCalendar className="text-purple-500 shrink-0" />
            {isMounted && (
              <DatePicker
                variant="borderless"
                className="flex-1 text-sm font-semibold"
                value={date ? dayjs(date) : null}
                suffixIcon={null}
                onChange={(d) => setDate(d ? d.format("YYYY-MM-DD") : "")}
                format="YYYY-MM-DD"
                placeholder="Pilih tanggal"
                allowClear={false}
              />
            )}
          </div>

          {/* Tombol Cari */}
          <button
            onClick={handleSearch}
            className="px-6 h-[44px] cursor-pointer rounded-xl bg-[#EF4444] text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
            <HiOutlineMagnifyingGlass className="text-lg" />
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
      {/* Venue Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-[400px] animate-pulse"
            />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-lg font-medium">
            Venue tidak ditemukan
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Coba ubah filter pencarian untuk melihat venue lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} showFieldPreview />
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
            <span className="text-sm text-gray-500 font-semibold bg-gray-100 px-3 py-1 rounded-md">
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
        <div className="flex items-center justify-center h-screen w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      }>
      <VenuesContent />
    </Suspense>
  );
}
