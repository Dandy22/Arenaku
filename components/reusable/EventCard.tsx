import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineClock,
} from "react-icons/hi2";

interface EventProps {
  event: {
    id: string | number;
    title: string;
    imageUrl?: string;
    date: string;
    startHour?: string | number;
    endHour?: string | number;
    city?: string;
    location?: string;
    district?: string;
    category?: string;
    topic?: string;
  };
}

export default function EventCard({ event }: EventProps) {
  // Parsing format tanggal
  const eventDate = new Date(event.date);

  // Format untuk Badge Kalender di pojok kanan atas (Contoh: "20 JULI")
  const badgeDay = eventDate.toLocaleDateString("id-ID", { day: "numeric" });
  const badgeMonth = eventDate
    .toLocaleDateString("id-ID", { month: "short" })
    .toUpperCase();

  // Format untuk list Detail Tanggal (Contoh: "10 September 2025, 15:00 PM")
  const fullDateString = eventDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatHour = (hour?: string | number) => {
    if (hour === undefined) return "";
    return `${String(hour).padStart(2, "0")}.00`; // format Indonesia pakai titik
  };

  const timeString =
    event.startHour && event.endHour
      ? `${formatHour(event.startHour)} - ${formatHour(event.endHour)} WIB`
      : event.startHour
        ? `${formatHour(event.startHour)} WIB`
        : "";

  const eventLabel = event.topic || event.category || "Aktivitas";
  const locationLabel =
    event.district || event.location || event.city || "Lokasi TBA";

  return (
    <Link
      href={`/activity/${event.id}`}
      className="group block bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition relative cursor-pointer flex flex-col h-full">
      {/* 1. Bagian Gambar & Badge */}
      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        <img
          src={
            event.imageUrl ||
            "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=600"
          }
          alt={event.title}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-700 shadow-sm">
          {eventLabel}
        </div>
        <div className="absolute top-3 right-3 bg-white border border-slate-200 rounded-md p-1.5 px-2.5 flex flex-col items-center justify-center shadow-md z-10">
          <HiOutlineCalendar size={18} className="text-slate-400 mb-0.5" />
          <span className="text-[11px] font-bold text-gray-500 text-center leading-tight whitespace-nowrap">
            {badgeDay} {badgeMonth}
          </span>
        </div>
      </div>

      {/* 2. Bagian Konten (Judul, Info, Tombol) */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Judul Acara */}
        <h3 className="font-bold text-black text-lg uppercase ">
          {event.title}
        </h3>

        {/* Info Tanggal & Lokasi */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          <p className="flex items-center gap-1 text-xs text-slate-400 font-medium truncate">
            <HiOutlineClock size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">
              {fullDateString}
              {timeString && `, ${timeString}`}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <HiOutlineMapPin size={12} className="shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </p>
        </div>

        {/* Tombol Action */}
        <div className="mt-auto pt-2">
          <div className="block text-center py-2 md:py-1.5 border border-gray-300 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500 transition group-hover:border-primary group-hover:text-primary">
            Pesan Tiket
          </div>
        </div>
      </div>
    </Link>
  );
}
