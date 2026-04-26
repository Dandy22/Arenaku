"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiOutlineMapPin } from "react-icons/hi2";
import api from "@/lib/axios";

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = params.id as string;

  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lapangan" | "gallery">(
    "lapangan",
  );

  useEffect(() => {
    api
      .get(`/venues/${venueId}`)
      .then((res) => setVenue(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [venueId]);

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={
          i < Math.round(rating)
            ? "text-purple-500 text-xl"
            : "text-gray-300 text-xl"
        }>
        ★
      </span>
    ));

  const avgRating = venue?.ratings?.length
    ? venue.ratings.reduce((a: number, r: any) => a + r.rating, 0) /
      venue.ratings.length
    : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-100 rounded-2xl h-72 animate-pulse mb-6" />
        <div className="bg-gray-100 rounded-xl h-8 w-48 animate-pulse mb-2" />
        <div className="bg-gray-100 rounded-xl h-5 w-32 animate-pulse" />
      </div>
    );
  }

  if (!venue) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Hero image */}
      <div className="rounded-2xl overflow-hidden h-64 md:h-80 bg-gray-100 mb-6">
        <img
          src={
            venue.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200"
          }
          alt={venue.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Rating + Name */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex gap-0.5 mb-1">{renderStars(avgRating)}</div>

          <h1 className="text-2xl font-bold text-gray-900 uppercase">
            {venue.name}
          </h1>

          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <HiOutlineMapPin size={14} />
            {venue.address}, {venue.city}
          </p>
        </div>

        <div className="text-right text-sm text-gray-500">
          <p className="mb-1">Bagikan Venue</p>

          <div className="flex gap-2">
            {["📋", "📘", "✖️", "💬"].map((icon, i) => (
              <button
                key={i}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-sm">
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["lapangan", "gallery"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TAB: LAPANGAN */}
      {activeTab === "lapangan" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {venue.fields?.map((field: any) => (
            <Link key={field.id} href={`/venues/${venueId}/${field.id}`}>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={
                      field.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400"
                    }
                    alt={field.name}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {field.name}
                  </h3>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {field.type} · P {field.length} x L {field.width}
                  </p>

                  <p className="text-xs text-purple-600 font-bold mt-1">
                    Rp. {field.price?.toLocaleString("id-ID")}
                  </p>

                  <button
                    className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                    }}>
                    Jadwal Mingguan
                  </button>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
                      <span
                        key={h}
                        className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                        {String(h).padStart(2, "0")}:00
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* TAB: GALLERY */}
      {activeTab === "gallery" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {venue.images?.map((img: any) => (
            <div
              key={img.id}
              className="aspect-video rounded-xl overflow-hidden bg-gray-100">
              <img
                src={img.url}
                alt="venue"
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {!venue.images?.length && (
            <p className="text-gray-400 text-sm col-span-full">
              Belum ada foto
            </p>
          )}
        </div>
      )}

      {/* LOKASI */}
      {venue.latitude && venue.longitude && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Lokasi Venue</h2>

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <HiOutlineMapPin size={16} className="text-purple-600" />
              {venue.address}
            </p>

            <a
              href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #9333EA)",
              }}>
              📍 Panduan Ke Lokasi
            </a>
          </div>

          <div className="rounded-xl overflow-hidden h-56 bg-gray-100">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=15&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
