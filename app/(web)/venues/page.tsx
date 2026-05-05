"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineTag,
} from "react-icons/hi2";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS, SPORT_TYPES } from "@/lib/constants";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";

import VenueCard from "@/components/reusable/VenueCard";

// Format enum → label: MINI_SOCCER → Mini Soccer
const formatTypeLabel = (value: string) => {
  if (!value) return "Semua";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

// Normalize label di SPORT_TYPES jaga-jaga jika constants masih pakai raw enum
const normalizedSportTypes = SPORT_TYPES.map((s) => ({
  ...s,
  label: formatTypeLabel(s.label !== s.value ? s.label : s.value),
}));

function VenuesContent() {
  const searchParams = useSearchParams();

  const [venues, setVenues] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [date, setDate] = useState(
    searchParams.get("date") || new Date().toISOString().split("T")[0],
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  // Label formatted untuk heading
  const typeLabel = formatTypeLabel(type);
  const districtLabel =
    BEKASI_DISTRICTS.find((d) => d.value === district)?.label ||
    district ||
    "Kota Bekasi";

  // Terima filters eksplisit agar tidak bergantung pada stale state
  const fetchVenues = async (
    p: number,
    filters: { name: string; district: string; type: string },
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.set("name", filters.name);
      if (filters.district) params.set("district", filters.district);
      if (filters.type) params.set("type", filters.type);
      params.set("page", String(p));
      params.set("limit", "8");

      const res = await api.get(`/venues?${params.toString()}`);
      if (res.data.data) {
        setVenues(res.data.data);
        setMeta(res.data.meta);
      } else {
        const data = res.data ?? [];
        setVenues(data);
        setMeta((prev) => ({ ...prev, total: data.length, totalPages: 1 }));
      }
    } catch {
      console.error("Failed to fetch venues");
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount — gunakan nilai dari URL params langsung (bukan state yg mungkin belum terupdate)
  useEffect(() => {
    fetchVenues(1, {
      name: searchParams.get("name") || "",
      district: searchParams.get("district") || "",
      type: searchParams.get("type") || "",
    });
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchVenues(1, { name, district, type });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Venue <span className="text-purple-600">{typeLabel}</span> di{" "}
          <span className="text-purple-600">{districtLabel}</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Berikut Venue <span className="text-purple-600">{typeLabel}</span> di{" "}
          <span className="text-purple-600">{districtLabel}</span> yang sudah
          memenuhi standar kualitas terbaik
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-8">
        <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl mb-3">
          <HiOutlineMagnifyingGlass className="text-primary shrink-0" />
          <input
            placeholder="Cari nama venue"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 h-[44px] bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineMapPin className="text-primary shrink-0" />
            <Select
              placeholder="Pilih Kecamatan"
              variant="borderless"
              className="flex-1 text-sm font-semibold"
              value={district || undefined}
              onChange={setDistrict}
              options={BEKASI_DISTRICTS}
            />
          </div>

          <div className="flex-1 h-[44px] bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineTag className="text-primary shrink-0" />
            <Select
              placeholder="Pilih Olahraga"
              variant="borderless"
              className="flex-1 text-sm font-semibold"
              value={type || undefined}
              onChange={setType}
              options={normalizedSportTypes}
            />
          </div>

          <div className="flex-1 h-[44px] bg-gray-50 border border-gray-200 rounded-xl px-4 flex items-center gap-2">
            <HiOutlineCalendar className="text-primary shrink-0" />
            <DatePicker
              variant="borderless"
              className="flex-1 text-sm font-semibold"
              value={date ? dayjs(date) : null}
              suffixIcon={null}
              onChange={(d) => setDate(d ? d.format("YYYY-MM-DD") : "")}
              format="YYYY-MM-DD"
              placeholder="Pilih tanggal"
            />
          </div>

          <button
            onClick={handleSearch}
            className="flex-1 md:flex-none h-[44px] px-6 cursor-pointer rounded-xl bg-[#EF4444] text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
            <HiOutlineMagnifyingGlass className="text-lg" />
            Cari Venue
          </button>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {venues.length > 0 ? (
            <>
              Ditemukan{" "}
              <span className="font-semibold text-gray-800">
                {meta.total} Venue tersedia
              </span>
            </>
          ) : (
            <span className="font-semibold text-gray-500">
              Tidak ada venue yang ditemukan
            </span>
          )}
        </p>
      )}

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} showSlots />
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
                const p = page - 1;
                setPage(p);
                fetchVenues(p, { name, district, type });
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
                const p = page + 1;
                setPage(p);
                fetchVenues(p, { name, district, type });
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