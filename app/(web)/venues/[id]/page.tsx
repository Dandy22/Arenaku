"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineMapPin,
  HiArrowLeft,
  HiMapPin,
  HiOutlineLink,
} from "react-icons/hi2";
import { Empty, message } from "antd";
import api from "@/lib/axios";
import RatingDisplay from "@/components/reusable/RatingDisplay";
import RatingList from "@/components/reusable/RatingList";

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
  images?: { id: string; url: string }[];
  fields?: Field[];
  ratings?: Rating[];
  vendorId: string;
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

function SlotBadge({ hour, booked }: { hour: number; booked?: boolean }) {
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded border ${
        booked
          ? "bg-slate-50 border-slate-200 text-slate-400"
          : "bg-purple-50 border-purple-100 text-primary"
      }`}>
      {String(hour).padStart(2, "0")}:00
    </span>
  );
}

function FieldCard({ field, venueId }: { field: Field; venueId: string }) {
  return (
    <Link
      href={`/venues/${venueId}/${field.id}`}
      className="block cursor-pointer">
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-200 transition-colors hover:shadow-md">
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img
            src={
              field.thumbnailUrl ||
              field.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"
            }
            alt={field.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-slate-900 text-sm">{field.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {field.type} · {field.length} x {field.width} m
          </p>
          <p className="text-xs text-primary font-semibold mt-1">
            Rp {field.price?.toLocaleString("id-ID")}
          </p>
          <button className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-colors cursor-pointer">
            Jadwal mingguan
          </button>
          <div className="mt-2 flex flex-wrap gap-1">
            {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
              <SlotBadge key={h} hour={h} />
            ))}
          </div>
        </div>
      </div>
    </Link>
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
        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
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

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("lapangan");

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

  const avgRating = venue?.ratings?.length
    ? venue.ratings.reduce((a, r) => a + r.rating, 0) / venue.ratings.length
    : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "lapangan", label: "Lapangan" },
    { key: "gallery", label: "Galeri" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-slate-100 rounded-2xl h-72 animate-pulse mb-6" />
        <div className="bg-slate-100 rounded-xl h-8 w-48 animate-pulse mb-2" />
        <div className="bg-slate-100 rounded-xl h-5 w-32 animate-pulse" />
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Breadcrumb / Tombol Kembali */}
      <button
        onClick={() => router.push("/venues")}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-purple-600 mb-4 cursor-pointer transition-colors">
        <HiArrowLeft size={16} /> Kembali
      </button>

      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-slate-100 mb-6 shadow-sm">
        <img
          src={
            venue.thumbnailUrl ||
            venue.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200"
          }
          alt={venue.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Venue header */}
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
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <HiOutlineMapPin size={14} />
            {venue.address}, {venue.city}
          </p>
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
              {/* Dummy FB Icon */}
              <button className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center cursor-pointer text-white">
                <svg
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
                </svg>
              </button>
              {/* Dummy X Icon */}
              <button className="w-8 h-8 rounded-full bg-black hover:bg-slate-800 transition flex items-center justify-center cursor-pointer text-white">
                <svg
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>
              {/* Dummy WA Icon */}
              <button className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center cursor-pointer text-white">
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M12.031 2c-5.5 0-9.972 4.475-9.972 9.976 0 1.758.455 3.473 1.322 4.98L2 22l5.166-1.353c1.455.808 3.101 1.233 4.865 1.233 5.498 0 9.969-4.475 9.969-9.976S17.53 2 12.031 2zm5.498 14.368c-.227.638-1.322 1.205-1.821 1.261-.468.053-1.077.067-1.808-.178-.458-.153-1.096-.381-2.22-1.055-1.503-.902-2.457-2.433-2.528-2.528-.071-.096-1.503-2.001-1.503-3.818 0-1.817.946-2.712 1.282-3.045.337-.333.727-.419.968-.419.24 0 .48.001.693.01.235.011.551-.095.862.664.325.808 1.096 2.673 1.192 2.864.095.192.161.419.019.706-.142.287-.213.468-.426.719-.213.251-.444.536-.639.719-.213.21-.439.439-.199.827.24.388 1.066 1.705 2.261 2.704 1.545 1.29 2.825 1.69 3.223 1.882.397.192.628.163.864-.096.236-.259.988-1.15 1.253-1.545.265-.395.53-.328.892-.192.362.136 2.29.988 2.687 1.18.397.192.662.287.758.45.096.163.096.945-.131 1.583z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-semibold transition cursor-pointer ${
              activeTab === tab.key
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-slate-400 hover:text-slate-600"
            }`}>
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab: Lapangan (Berisi Daftar Lapangan, Ulasan, dan Lokasi) */}
      {activeTab === "lapangan" && (
        <div className="space-y-12">
          {/* Section: Lapangan */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {venue.fields?.map((field) => (
                <FieldCard key={field.id} field={field} venueId={venueId} />
              ))}
              {!venue.fields?.length && (
                <div className="col-span-full py-12">
                  <Empty description="Belum ada lapangan tersedia" />
                </div>
              )}
            </div>
          </div>

          {/* Section: Rating & ulasan */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Rating & Ulasan
            </h2>
            <div className="space-y-6">
              {/* Rating Summary */}
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
                              className="bg-purple-600 h-2 rounded-full"
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

          {/* Section: Lokasi */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">Lokasi Venue</h2>
              {venue.latitude && venue.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-colors cursor-pointer w-fit shrink-0">
                  <HiMapPin size={14} />
                  Panduan ke lokasi
                </a>
              )}
            </div>

            <p className="text-sm text-slate-600 flex items-center gap-1.5 mb-4">
              <HiOutlineMapPin size={18} className="text-purple-600" />
              {venue.address}, {venue.city}
            </p>

            {venue.latitude && venue.longitude ? (
              <div className="rounded-xl overflow-hidden h-64 bg-slate-100 shadow-sm border border-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  title="Lokasi venue"
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

      {/* Tab: Gallery */}
      {activeTab === "gallery" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {venue.images?.map((img) => (
            <div
              key={img.id}
              className="aspect-video rounded-xl overflow-hidden bg-slate-100">
              <img
                src={img.url}
                alt="foto venue"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
          {!venue.images?.length && (
            <p className="text-slate-400 text-sm col-span-full py-12 text-center">
              Belum ada foto
            </p>
          )}
        </div>
      )}
    </div>
  );
}
