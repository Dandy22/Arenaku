"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message } from "antd";
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineChevronDown,
} from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    api
      .get(`/events/${eventId}`)
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  // Countdown timer
  useEffect(() => {
    if (!event) return;

    const interval = setInterval(() => {
      const diff = new Date(event.date).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0",
        )}:${String(s).padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const handleJoin = async () => {
    if (!user) {
      message.warning("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    // hanya CUSTOMER yang boleh join
    if (user.role !== "CUSTOMER") {
      message.error("Hanya customer yang dapat membeli tiket event");
      return;
    }

    setJoining(true);

    try {
      // Add to cart instead of directly joining
      await api.post("/cart", {
        eventId,
        quantity: 1,
      });

      message.success("Tiket ditambahkan ke keranjang! Silakan checkout.");
      router.push("/cart");
    } catch (err: any) {
      message.error(
        err.response?.data?.error || "Gagal menambahkan ke keranjang",
      );
    } finally {
      setJoining(false);
    }
  };

  const isFull = event && event.participants?.length >= event.capacity;

  const isJoined = event?.participants?.some((p: any) => p.userId === user?.id);

  // Tiket tidak tersedia jika: penuh, sudah join, atau event sudah berakhir
  const isTicketUnavailable =
    isFull || isJoined || isExpired || user?.role === "VENDOR";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-100 rounded-2xl h-72 animate-pulse mb-6" />
      </div>
    );
  }

  if (!event) return null;

  const sections = [
    {
      key: "additional",
      title: "Informasi Tambahan",
      content: event.additionalInfo,
    },
    {
      key: "terms",
      title: "Syarat dan Ketentuan",
      content: event.termsConditions,
    },
    event.contactName
      ? {
          key: "contact",
          title: "Informasi Narahubung",
          content: `Nama: ${event.contactName}${
            event.contactEmail ? `\nEmail: ${event.contactEmail}` : ""
          }${event.contactPhone ? `\nPhone: ${event.contactPhone}` : ""}`,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT SIDE */}
        <div className="flex-1">
          {/* Poster */}
          <div className="rounded-2xl overflow-hidden aspect-video bg-gray-100 mb-6">
            <img
              src={
                event.imageUrl ||
                "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800"
              }
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Deskripsi Event
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            "{event.description}"
          </p>

          {/* Expandable Sections */}
          {sections.map(
            (section: any) =>
              section?.content && (
                <div
                  key={section.key}
                  className="mb-3 border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setOpenSection(
                        openSection === section.key ? null : section.key,
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition">
                    <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                      📋 {section.title}
                    </span>

                    <HiOutlineChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform ${
                        openSection === section.key ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openSection === section.key && (
                    <div className="px-4 py-3">
                      {section.content
                        .split("\n")
                        .map((line: string, i: number) => (
                          <p key={i} className="text-sm text-gray-600 mb-1">
                            • {line.replace(/^-\s*/, "")}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              ),
          )}

          {/* MAP */}
          {event.latitude && event.longitude && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Lokasi Event
              </h2>

              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <HiOutlineMapPin size={16} className="text-purple-600" />
                  {event.location}
                </p>

                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  📍 Panduan Ke Lokasi
                </a>
              </div>

              <div className="rounded-xl overflow-hidden h-56">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full md:w-80 shrink-0">
          <div className="sticky top-20">
            {/* Category + Countdown */}
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-purple-700 bg-purple-100">
                {event.category || "Olahraga"}
              </span>

              {timeLeft && (
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${isExpired ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                  {isExpired ? "Event Berakhir" : `Sisa Waktu ${timeLeft}`}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase">
              {event.title}
            </h1>

            <p className="text-xs text-gray-500 mb-1">Diselenggarakan oleh:</p>

            <p className="text-sm font-semibold text-gray-800 mb-3">
              {event.creator?.name}
            </p>

            <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              <HiOutlineClock size={14} />
              {new Date(event.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              , {event.startHour}:00 - {event.endHour}:00
            </div>

            <div className="text-sm text-gray-600 mb-4 flex items-center gap-1">
              <HiOutlineMapPin size={14} />
              {event.location}
            </div>

            {/* Ticket Card */}
            <div className="border border-gray-200 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  Tournament Pass
                </span>

                <span className="text-sm font-bold text-gray-900">
                  Rp {event.ticketPrice?.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isExpired || isFull
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                  {isExpired
                    ? "Tidak Tersedia"
                    : isFull
                      ? "Habis Terjual"
                      : "Tersedia"}
                </span>

                <button
                  onClick={handleJoin}
                  disabled={isTicketUnavailable}
                  className="px-4 py-1.5 rounded-lg text-white text-xs font-bold transition disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  {user?.role === "VENDOR"
                    ? "Vendor Tidak Bisa Join"
                    : isExpired
                      ? "Event Berakhir"
                      : isJoined
                        ? "Sudah Join"
                        : isFull
                          ? "Penuh"
                          : joining
                            ? "Memproses..."
                            : "Beli Tiket"}
                </button>
              </div>
            </div>

            {/* Status Card */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  Tournament Pass
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isExpired || isFull
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                  {isExpired
                    ? "Tidak Tersedia"
                    : isFull
                      ? "Habis Terjual"
                      : "Tersedia"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
