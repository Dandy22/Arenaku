"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineMapPin,
  HiArrowLeft,
  HiMapPin,
  HiOutlineLink,
  HiOutlineClock,
} from "react-icons/hi2";
import { Empty, message, Image, Modal } from "antd";
import { useAuthStore } from "@/lib/store/auth.store";
import { useCartStore } from "@/lib/store/cart.store";
import api from "@/lib/axios";

type Tab = "lapangan" | "gallery";

interface Field {
  id: string;
  name: string;
  type: string;
  length: number;
  width: number;
  price: number;
  thumbnailUrl?: string;
  images?: { url: string }[];
  orderItems?: { startHour: number }[]; //   Tambahan field API
}

interface Rating {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  thumbnailUrl?: string;
  images?: { id: string; url: string; title?: string }[];
  fields?: Field[];
  ratings?: Rating[];
  vendorId: string;
  openHour?: number;
  closeHour?: number;
  isOpen?: boolean;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? "#7C3AED" : "none"}
          stroke="#7C3AED"
          strokeWidth={1.5}
          xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

//   UPDATE: FieldCard menangkap data bookedSlots dan membuang slot yang ada di dalamnya
function FieldCard({
  field,
  venue,
  bookedSlots,
  onQuickBook,
}: {
  field: Field;
  venue: Venue;
  bookedSlots: number[]; // Array jam yang sudah lunas
  onQuickBook: (field: Field, hour: number) => void;
}) {
  const openHour = venue.openHour ?? 8;
  const closeHour = venue.closeHour ?? 22;
  const isOpen = venue.isOpen ?? true;

  // LOGIKA JAM HARI INI
  const currentHour = new Date().getHours();
  const totalHours = Math.max(0, closeHour - openHour);

  // Hanya ambil jam yang BELUM LEWAT hari ini DAN BELUM DIBOOKING
  const availableSlots = Array.from(
    { length: totalHours },
    (_, i) => openHour + i,
  ).filter((h) => h > currentHour && !bookedSlots.includes(h));

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl overflow-hidden transition-colors flex flex-col ${
        isOpen ? "hover:border-purple-200 hover:shadow-md" : "opacity-80"
      }`}>
      <Link
        href={isOpen ? `/venues/${venue.id}/${field.id}` : "#"}
        className="block group">
        <div className="aspect-video bg-slate-100 overflow-hidden relative">
          <img
            src={
              field.thumbnailUrl ||
              field.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"
            }
            alt={field.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!isOpen && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                Tutup Sementara
              </span>
            </div>
          )}
        </div>
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-bold text-slate-900 text-sm md:text-base">
            {field.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {field.type.replace("_", " ")} <span className="mx-1">•</span> P{" "}
            {field.length} x L {field.width} m
          </p>
          <p className="text-sm font-bold text-[#7C3AED] mt-1">
            Rp {field.price?.toLocaleString("id-ID")}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4 mt-auto">
        <Link
          href={isOpen ? `/venues/${venue.id}/${field.id}` : "#"}
          className={`mt-1 w-full py-2 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center ${
            isOpen
              ? "bg-[#7C3AED] hover:bg-[#6D28D9] cursor-pointer"
              : "bg-slate-300 pointer-events-none"
          }`}>
          {isOpen ? "Jadwal mingguan" : "Tidak Tersedia"}
        </Link>

        {/* JADWAL DUA KOTAK DUA KOTAK KE BAWAH HARI INI */}
        {isOpen && availableSlots.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {availableSlots.map((h) => (
              <button
                key={h}
                onClick={(e) => {
                  e.preventDefault();
                  onQuickBook(field, h);
                }}
                className="border border-slate-200 bg-white rounded-lg py-2 flex flex-col items-center justify-center hover:border-[#7C3AED] hover:shadow-sm transition-all cursor-pointer">
                <p className="text-[11px] font-bold text-slate-700">
                  {String(h).padStart(2, "0")}:00 -{" "}
                  {String(h + 1 === 24 ? 0 : h + 1).padStart(2, "0")}:00
                </p>
                <p className="text-[11px] text-slate-500 my-0.5">
                  Rp {field.price?.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] font-bold text-green-500 tracking-wide">
                  Tersedia
                </p>
              </button>
            ))}
          </div>
        )}
        {isOpen && availableSlots.length === 0 && (
          <p className="text-xs text-center text-slate-400 mt-4 italic font-medium">
            Jadwal hari ini sudah lewat atau penuh.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ review }: { review: Rating }) {
  const initials = review.user?.name
    ? review.user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div className="py-4 border-b border-slate-100 last:border-0 last:pb-0 first:pt-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-semibold text-purple-600 flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {review.user?.name || "Pengguna"}
          </p>
          <p className="text-xs text-slate-400">
            {new Date(review.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <StarRow rating={review.rating} size={12} />
      {review.comment && (
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;
  const { user } = useAuthStore();
  const { fetchCart } = useCartStore();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("lapangan");

  const [quickBookData, setQuickBookData] = useState<{
    field: Field;
    hour: number;
  } | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    api
      .get(`/venues/${venueId}`)
      .then((res) => setVenue(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [venueId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("Link venue berhasil disalin!");
  };

  const handleQuickBook = (field: Field, hour: number) => {
    if (!user) {
      message.warning("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }
    setQuickBookData({ field, hour });
  };

  const confirmQuickBook = async () => {
    if (!quickBookData) return;
    setAddingToCart(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post("/cart", {
        fieldId: quickBookData.field.id,
        date: today,
        startHour: quickBookData.hour,
        endHour: quickBookData.hour + 1,
      });
      await fetchCart();
      message.success("1 slot berhasil ditambahkan ke cart");
      setQuickBookData(null);
      router.push("/cart");
    } catch (err: any) {
      message.error(err.response?.data?.error || "Gagal menambahkan ke cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-slate-100 rounded-2xl h-72 animate-pulse mb-6" />
        <div className="bg-slate-100 rounded-xl h-8 w-48 animate-pulse mb-2" />
        <div className="bg-slate-100 rounded-xl h-5 w-32 animate-pulse" />
      </div>
    );
  if (!venue) return null;

  const avgRating = venue.ratings?.length
    ? venue.ratings.reduce((a, r) => a + r.rating, 0) / venue.ratings.length
    : 0;
  const openHourStr = String(venue.openHour ?? 8).padStart(2, "0");
  const closeHourStr = String(venue.closeHour ?? 22).padStart(2, "0");
  const isOpen = venue.isOpen ?? true;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.push("/venues")}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#7C3AED] transition-colors cursor-pointer">
          <HiArrowLeft size={16} /> Kembali
        </button>
        <span
          className={`text-[11px] px-3 py-1 rounded-md font-bold tracking-wider border ${
            isOpen
              ? "bg-green-50 text-green-600 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`}>
          {isOpen ? "BUKA" : "TUTUP SEMENTARA"}
        </span>
      </div>

      <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-slate-100 mb-6 shadow-sm relative">
        <img
          src={
            venue.thumbnailUrl ||
            venue.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200"
          }
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        {isOpen === false && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest shadow-lg">
              Venue Sedang Tutup
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
        <div>
          {avgRating > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <StarRow rating={avgRating} size={15} />
              <span className="text-sm font-semibold text-slate-700">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400">
                ({venue.ratings?.length} ulasan)
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            {venue.name}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2">
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <HiOutlineMapPin size={16} />
              {venue.address}, {venue.city}
            </p>
            <span className="hidden sm:block text-slate-300">•</span>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
              <HiOutlineClock size={16} />
              {openHourStr}:00 - {closeHourStr}:00 WIB
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex flex-col items-start2">
            <span className="text-[11px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Bagikan Venue
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center cursor-pointer text-slate-600">
                <HiOutlineLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        {(["lapangan", "gallery"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-slate-400 hover:text-slate-600"
            }`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "lapangan" && (
        <div className="space-y-12">
          {/* CARD LAPANGAN DIMUNCULKAN */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venue.fields?.map((field: any) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  venue={venue}
                  //   Oper data jam yang sudah dibooking ke FieldCard
                  bookedSlots={
                    field.orderItems?.map((oi: any) => oi.startHour) || []
                  }
                  onQuickBook={handleQuickBook}
                />
              ))}
              {!venue.fields?.length && (
                <div className="col-span-full py-12">
                  <Empty description="Belum ada lapangan tersedia" />
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Rating & Ulasan
            </h2>
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">
                      {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                    </div>
                    <StarRow rating={avgRating} size={16} />
                    <div className="text-sm text-slate-500 mt-1">
                      {venue.ratings?.length || 0} ulasan
                    </div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        venue.ratings?.filter((r) => r.rating === star)
                          .length || 0;
                      const percentage = venue.ratings?.length
                        ? (count / venue.ratings.length) * 100
                        : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-slate-600 w-3">
                            {star}
                          </span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-[#7C3AED] h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 w-8">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100" />
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-4">
                  Semua ulasan
                </h3>
                {venue.ratings && venue.ratings.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {venue.ratings.map((r) => (
                      <ReviewItem key={r.id} review={r} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Empty description="Belum ada ulasan untuk venue ini" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">Lokasi Venue</h2>
              {venue.latitude && venue.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold bg-gradient-to-r bg-primary transition-colors cursor-pointer w-fit shrink-0">
                  <HiMapPin size={14} /> Panduan ke lokasi
                </a>
              )}
            </div>
            <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-4">
              <HiOutlineMapPin size={18} className="text-primary" />
              {venue.address}, {venue.city}
            </p>
            {venue.latitude && venue.longitude ? (
              <div className="rounded-xl overflow-hidden h-64 bg-slate-100 shadow-sm border border-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`}
                />
              </div>
            ) : (
              <div className="py-12 bg-slate-50 rounded-xl border border-slate-100">
                <Empty description="Koordinat lokasi belum tersedia" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* GALERI */}
      {activeTab === "gallery" && (
        <Image.PreviewGroup>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {venue.images?.map((img) => (
              <div key={img.id} className="flex flex-col gap-2">
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                  <Image
                    src={img.url}
                    alt={img.title || "foto venue"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-sm font-bold text-slate-700 px-1 truncate">
                  {img.title || "Foto Venue"}
                </p>
              </div>
            ))}
            {!venue.images?.length && (
              <div className="col-span-full py-12 flex justify-center">
                <Empty description="Belum ada foto galeri" />
              </div>
            )}
          </div>
        </Image.PreviewGroup>
      )}

      {/* QUICK BOOK MODAL HARI INI */}
      <Modal
        title={
          <span className="font-bold text-slate-800">Konfirmasi Pemesanan</span>
        }
        open={!!quickBookData}
        onOk={confirmQuickBook}
        onCancel={() => setQuickBookData(null)}
        okText={addingToCart ? "Memproses..." : "Ya, Lanjutkan"}
        cancelText="Batal"
        getContainer={false}
        okButtonProps={{
          disabled: addingToCart,
          style: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
          className: "cursor-pointer",
        }}
        cancelButtonProps={{
          disabled: addingToCart,
          className: "cursor-pointer",
        }}>
        {quickBookData && (
          <>
            <p className="text-slate-500 mb-4 mt-2">
              Anda akan memesan <strong>1 slot</strong> untuk lapangan{" "}
              <strong>{quickBookData.field.name}</strong> dengan total:
            </p>
            <div className="bg-purple-50 p-4 rounded-xl mb-4 border border-purple-100">
              <p className="text-2xl font-bold text-[#7C3AED]">
                Rp {quickBookData.field.price?.toLocaleString("id-ID")}
              </p>
            </div>
            <ul className="text-sm text-slate-500 space-y-1.5">
              <li className="flex items-center gap-2 font-medium text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                Hari Ini | {String(quickBookData.hour).padStart(2, "0")}:00 -{" "}
                {String(
                  quickBookData.hour + 1 === 24 ? 0 : quickBookData.hour + 1,
                ).padStart(2, "0")}
                :00
              </li>
            </ul>
          </>
        )}
      </Modal>
    </div>
  );
}
