"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message } from "antd";
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiArrowLeft,
  HiOutlineInformationCircle,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineLink,
} from "react-icons/hi2";
import { useAuthStore } from "@/lib/store/auth.store";
import api from "@/lib/axios";

// Fungsi untuk mendapatkan inisial penyelenggara
function getInitials(name: string) {
  if (!name) return "AK";
  return name.substring(0, 2).toUpperCase();
}

// Memformat string kategori untuk tampilan
function formatDisplayCategory(cat: string) {
  if (!cat) return "Aktivitas";
  return cat
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [ticketTiers, setTicketTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  // State untuk toggle deskripsi tiket
  const [expandedTickets, setExpandedTickets] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    api
      .get(`/events/${eventId}`)
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    api
      .get(`/events/${eventId}/tickets`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTicketTiers(res.data);
        } else {
          setTicketTiers([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load ticket tiers:", err);
        setTicketTiers([]);
      });
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

  const handleJoin = async (ticketTierId?: string) => {
    if (!user) {
      message.warning("Silakan login terlebih dahulu");
      router.push("/login");
      return;
    }

    if (user.role !== "CUSTOMER") {
      message.error("Hanya customer yang dapat membeli tiket event");
      return;
    }

    setJoining(true);

    try {
      await api.post("/cart", {
        eventId,
        ticketTierId,
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("Link event berhasil disalin!");
  };

  // Fungsi untuk toggle deskripsi tiket
  const toggleTicket = (id: string) => {
    setExpandedTickets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderDescription = () => {
    if (!event.description) return null;

    const text = event.description.trim();
    const containsHtml = /<[a-z][\s\S]*>/i.test(text);

    if (containsHtml) {
      return (
        <div
          className="quill-content text-sm text-slate-600 leading-relaxed mb-10 prose prose-sm prose-slate max-w-none break-words overflow-hidden"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }

    const lines = text
      .split("\n")
      .map((line: string) => line.trim())
      .filter(Boolean) as string[];

    const isBulletList = lines.every((line: string) => /^[-•*]\s+/.test(line));

    return isBulletList ? (
      <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 mb-10">
        {lines.map((line: string, i: number) => (
          <li key={i}>{line.replace(/^[-•*]\s+/, "")}</li>
        ))}
      </ul>
    ) : (
      <div className="space-y-4 text-sm text-slate-600 mb-10">
        {lines.map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  };

  const isFull = event && event.participants?.length >= event.capacity;
  const isJoined = event?.participants?.some((p: any) => p.userId === user?.id);
  const isVendorView = user?.role === "VENDOR";

  // Tiket tidak tersedia jika: penuh, sudah join, atau event sudah berakhir.
  // Vendor tetap bisa melihat semua tiket, tetapi tidak dapat beli.
  const isTicketUnavailable = isFull || isJoined || isExpired;

  const getUnavailableText = () => {
    if (isVendorView) return "VENDOR TIDAK BISA MEMBELI TIKET";
    if (isExpired) return "Telah Berakhir";
    if (isJoined) return "HANYA SATU AKSES EMAIL";
    if (isFull) return "Habis Terjual";
    return "Tidak Tersedia";
  };

  const effectiveTicketTiers =
    ticketTiers && ticketTiers.length > 0
      ? ticketTiers
      : event?.ticketTiers || [];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-slate-100 rounded-2xl h-[400px] animate-pulse mb-6" />
      </div>
    );
  }

  if (!event) return null;

  const sections = [
    {
      key: "additional",
      title: "Informasi Tambahan",
      content: event.additionalInfo,
      icon: (
        <HiOutlineInformationCircle size={18} className="text-purple-500" />
      ),
    },
    {
      key: "terms",
      title: "Syarat dan Ketentuan",
      content: event.termsConditions,
      icon: <HiOutlineDocumentText size={18} className="text-purple-500" />,
    },
    event.contactName
      ? {
          key: "contact",
          title: "Informasi Narahubung",
          content: `Nama: ${event.contactName}${
            event.contactEmail ? `\nEmail: ${event.contactEmail}` : ""
          }${event.contactPhone ? `\nPhone: ${event.contactPhone}` : ""}`,
          icon: <HiOutlinePhone size={18} className="text-purple-500" />,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Tombol Kembali di atas */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors cursor-pointer w-fit">
          <HiArrowLeft size={16} /> Kembali
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* L E F T   S I D E */}
        <div className="flex-1 w-full min-w-0">
          {/* Poster Hero */}
          <div className="rounded-2xl overflow-hidden aspect-[21/9] bg-slate-100 mb-6 shadow-sm border border-slate-100 relative">
            <img
              src={
                event.imageUrl ||
                "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1200"
              }
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Share Row */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Deskripsi Event
            </h2>

            {/* Bagikan Event Icons */}
            <div className="flex-col items-center gap-4">
              <span className="text-xs text-slate-400 font-medium">
                BAGIKAN EVENT
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

          {renderDescription()}

          {/* Expandable Sections */}
          <div className="space-y-3 mb-8">
            {sections.map(
              (section: any) =>
                section?.content && (
                  <div
                    key={section.key}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
                    <button
                      onClick={() =>
                        setOpenSection(
                          openSection === section.key ? null : section.key,
                        )
                      }
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition cursor-pointer">
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-2.5">
                        {section.icon} {section.title}
                      </span>
                      <HiOutlineChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform duration-300 ${
                          openSection === section.key ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openSection === section.key && (
                      <div className="px-5 pb-4 pt-1 bg-white border-t border-slate-100">
                        {section.content
                          .split("\n")
                          .map((line: string, i: number) => (
                            <div
                              key={i}
                              className="flex gap-2 text-sm text-slate-600 mb-1.5 leading-relaxed">
                              <span className="text-slate-400 mt-0.5">•</span>
                              <p>{line.replace(/^-\s*/, "")}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ),
            )}
          </div>

          {/* MAP */}
          {event.latitude && event.longitude && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Lokasi Event
              </h2>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <p className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                  <HiOutlineMapPin
                    size={18}
                    className="text-purple-500 shrink-0"
                  />
                  {event.location}
                </p>

                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-semibold cursor-pointer hover:opacity-90 hover:shadow-md transition-all shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                  }}>
                  <HiOutlineMapPin size={14} /> Panduan Ke Lokasi
                </a>
              </div>

              <div className="rounded-xl overflow-hidden h-64 border border-slate-200 shadow-sm bg-slate-100">
                <iframe
                  width="100%"
                  height="100%"
                  loading="lazy"
                  title="Peta Lokasi"
                  src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`}
                />
              </div>
            </div>
          )}
        </div>

        {/* R I G H T   S I D E (DIUBAH DISINI: Sticky Wrapper dengan dua bagian Flex) */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-24 flex flex-col shadow-sm rounded-2xl bg-white border border-slate-200 max-h-[calc(100vh-120px)] overflow-hidden">
            {/* --- BAGIAN ATAS: Informasi (Tetap Diam / Tidak Ter-Scroll) --- */}
            <div className="p-5 pb-6 border-b border-slate-200 shrink-0">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-[11px] text-slate-400 mb-1 font-medium">
                    Kategori Aktivitas
                  </p>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 inline-block">
                    {formatDisplayCategory(event.category)}
                  </span>
                </div>

                {timeLeft && (
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                      isExpired
                        ? "bg-red-50 text-red-600"
                        : "bg-purple-50 text-purple-600"
                    }`}>
                    {isExpired ? "Event Berakhir" : `Sisa Waktu ${timeLeft}`}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight uppercase break-words">
                {event.title}
              </h1>

              <div className="space-y-4">
                {/* Penyelenggara */}
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5 font-medium">
                    Diselenggarakan oleh
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold">
                      {getInitials(event.creator?.name)}
                    </div>
                    <p className="text-base font-bold text-slate-800">
                      {event.creator?.name || "Arenaku Komunitas"}
                    </p>
                  </div>
                </div>

                {/* Waktu & Lokasi */}
                <div className="space-y-2 pt-2">
                  <div className="text-[13px] text-slate-500 font-medium flex items-center gap-2">
                    <HiOutlineClock
                      size={16}
                      className="text-purple-500 shrink-0"
                    />
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    , {event.startHour}:00 PM{" "}
                    <svg
                      viewBox="64 64 896 896"
                      focusable="false"
                      width="12px"
                      height="12px"
                      fill="currentColor"
                      className="text-slate-500">
                      <path d="M873.1 596.2l-164-208A32 32 0 00684 376h-64.8c-6.7 0-10.4 7.7-6.3 13l144.3 183H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c26.8 0 41.7-30.8 25.2-51.8z"></path>
                    </svg>{" "}
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    , {event.endHour}:00 PM
                  </div>
                  <div className="text-[13px] text-slate-500 font-medium flex items-start gap-2">
                    <HiOutlineMapPin
                      size={16}
                      className="text-purple-500 shrink-0 mt-0.5"
                    />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {effectiveTicketTiers.length > 0 ? (
                <div className="space-y-4">
                  {effectiveTicketTiers.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white transition-all">
                      {/* Header Tiket (Bisa diklik untuk Minimize/Maximize) */}
                      <div
                        className="flex items-start justify-between gap-4 cursor-pointer"
                        onClick={() => toggleTicket(ticket.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-base">
                              {ticket.name}
                            </p>
                            <HiOutlineChevronDown
                              size={18}
                              className={`text-slate-400 transition-transform duration-300 ${
                                expandedTickets[ticket.id] ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-semibold text-slate-900 text-base">
                            Rp.{ticket.price?.toLocaleString("id-ID") || "0"}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {ticket.stock} tiket tersedia
                          </p>
                        </div>
                      </div>

                      {/* Deskripsi Tiket (Dropdown/Accordion) */}
                      {expandedTickets[ticket.id] && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-sm text-slate-500">
                            {ticket.description || "Tidak ada deskripsi tiket"}
                          </p>
                        </div>
                      )}

                      {isTicketUnavailable || isVendorView ? (
                        <div className="mt-4 w-full py-2.5 rounded-lg text-center text-[13px] font-semibold bg-slate-100 text-slate-500">
                          {isVendorView
                            ? "VENDOR TIDAK BISA MEMBELI TIKET"
                            : getUnavailableText()}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(ticket.id)}
                          className="mt-4 w-full bg-[#6D28D9] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-purple-800 transition-colors cursor-pointer">
                          {joining ? "Memproses..." : "Beli Tiket"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Tampilan Ticket Card (Besar) - Tersedia
                <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-[15px]">
                      Tournament Pass
                    </span>
                    <span className="font-bold text-slate-900 text-[15px]">
                      Rp.{event.ticketPrice?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] px-3 py-1.5 rounded-md font-bold bg-purple-50 text-purple-600 uppercase">
                      Tersedia
                    </span>
                    {isTicketUnavailable || isVendorView ? (
                      <div className="mt-4 w-full py-2.5 rounded-lg text-center text-[13px] font-semibold bg-slate-100 text-slate-500">
                        {isVendorView ? "Akses VENDOR" : getUnavailableText()}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin()}
                        className="bg-[#6D28D9] text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-purple-800 transition-colors cursor-pointer">
                        {joining ? "Memproses..." : "Beli Tiket"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
