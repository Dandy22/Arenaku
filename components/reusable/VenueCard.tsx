import Link from "next/link";
import { HiHome, HiOutlineMapPin, HiOutlineTicket } from "react-icons/hi2";
import { useRouter } from "next/navigation";

interface VenueProps {
  venue: {
    id: string | number;
    name: string;
    city: string;
    district?: string;
    address?: string;
    thumbnailUrl?: string;
    images?: any[];
    ratings?: any[];
    fields?: any[];
    openHour?: number;
    closeHour?: number;
    isOpen?: boolean;
  };
  isPromo?: boolean;
  promoDiscount?: number;
  showFieldPreview?: boolean;
}

export default function VenueCard({
  venue,
  isPromo = false,
  promoDiscount,
  showFieldPreview = false,
}: VenueProps) {
  const formatPrice = (price: number) => `Rp ${price?.toLocaleString("id-ID")}`;

  const getMinPrice = (fields?: any[]) => {
    if (!fields?.length) return 0;
    return Math.min(...fields.map((f) => f.price));
  };

  const router = useRouter();

  const getAvgRating = (ratings?: any[]) => {
    if (!ratings?.length) return 0;
    return (
      ratings.reduce((a: number, r: any) => a + r.rating, 0) / ratings.length
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < Math.round(rating) ? "text-primary" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  // =========================
  // JAM OPERASIONAL DINAMIS
  // =========================
  const openHour = venue.openHour ?? 8;
  const closeHour = venue.closeHour ?? 22;
  const isOpen = venue.isOpen ?? true;

  const totalHours = Math.max(0, closeHour - openHour);

  // semua jam ditampilkan
  const slots = Array.from({ length: totalHours }, (_, i) => openHour + i);

  // Ambil lapangan pertama untuk dijadikan preview
  const firstField = venue.fields?.[0];

  return (
    <Link
      href={`/venues/${venue.id}`}
      className={`group block bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition relative cursor-pointer flex flex-col h-full ${
        !isOpen
          ? "opacity-90 hover:shadow-none"
          : "hover:shadow-md hover:border-purple-200"
      }`}>
      {/* Promo Badge */}
      {isPromo && (
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 bg-[#7c3aed] text-white px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold flex items-center gap-1 md:gap-1.5 shadow-md uppercase tracking-wide">
          <HiOutlineTicket className="rotate-[-10deg] w-3 h-3 md:w-3.5 md:h-3.5" />
          <span>PROMO</span>

          {promoDiscount && (
            <span className="border-l border-white/30 ml-0.5 pl-1 md:ml-1 md:pl-1.5">
              {promoDiscount}%
            </span>
          )}
        </div>
      )}

      {/* GAMBAR */}
      <div className="aspect-[4/3] md:aspect-video bg-gray-100 overflow-hidden relative">
        <img
          src={
            venue.thumbnailUrl ||
            venue.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400"
          }
          alt={venue.name}
          className={`w-full h-full object-cover transition duration-300 ${
            isOpen ? "group-hover:scale-105" : "grayscale"
          }`}
        />

        {!isOpen && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-md">
              Tutup Sementara
            </span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3 md:p-4 flex flex-col gap-1.5 flex-1">
        {/* Rating */}
        <div className="flex text-sm md:text-lg mb-0.5">
          {renderStars(getAvgRating(venue.ratings))}
        </div>

        {/* Nama Venue */}
        <h3 className="font-bold text-black text-[13px] sm:text-[15px] md:text-lg uppercase leading-snug line-clamp-2">
          {venue.name}
        </h3>

        {/* Info */}
        <p className="flex items-center gap-1 text-[10px] md:text-xs text-slate-400 font-medium mt-0.5 truncate">
          <HiHome className="shrink-0 text-slate-400 w-3 h-3 md:w-[14px] md:h-[14px]" />

          <span className="truncate">
            {venue.city} · {venue.fields?.[0]?.type || "Olahraga"} ·
            <span className="font-semibold text-primary ml-1">
              {venue.fields?.length || 0} Lapangan
            </span>
          </span>
        </p>

        {/* Lokasi */}
        <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 truncate">
          <HiOutlineMapPin className="shrink-0 w-3 h-3 md:w-3 md:h-3" />

          <span className="truncate">
            {venue.district || venue.address || "Lokasi belum tersedia"}
          </span>
        </p>

        {/* Harga Asli Lu */}
        <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
          Harga mulai{" "}
          <span className="text-primary font-bold whitespace-nowrap">
            {formatPrice(getMinPrice(venue.fields))}
          </span>
        </p>

        {/* PREVIEW JAM & INFO LAPANGAN */}
        {showFieldPreview && firstField && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            {/* INI FIX-NYA: Ambil murni nama lapangannya (cth: Lapangan 1 VIP) */}
            <h4 className="font-bold text-black text-[12px] sm:text-[14px] mb-0.5 leading-snug">
              {firstField.name}
            </h4>
            <p className="text-[10px] md:text-[11px] text-slate-500 font-medium mb-2 flex items-center gap-1">
              {firstField.type === "MINI_SOCCER"
                ? "Mini Soccer"
                : firstField.type}{" "}
              <span className="text-slate-300">•</span> P{" "}
              {firstField.length || 0} x L {firstField.width || 0}
            </p>

            <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5 mt-1">
              {slots.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={(e) => {
                    // Mencegah outer <Link> ke venue.id ketrigger
                    e.preventDefault();
                    e.stopPropagation();

                    // Langsung redirect spesifik ke jadwal lapangan tersebut
                    if (firstField.id) {
                      router.push(`/venues/${venue.id}/${firstField.id}`);
                    }
                  }}
                  className={`relative z-10 w-full text-center px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    isOpen
                      ? "border-purple-200 text-purple-600 bg-white hover:bg-purple-600 hover:text-white hover:border-purple-600 cursor-pointer"
                      : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                  }`}>
                  {String(h).padStart(2, "0")}:00
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BUTTON ASLI LU */}
        <div className="mt-auto pt-2.5 md:pt-3">
          <div
            className={`block text-center py-1.5 md:py-2 border rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition ${
              isOpen
                ? "border-gray-200 md:border-gray-300 text-slate-500 group-hover:border-primary group-hover:text-primary group-hover:bg-purple-50"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}>
            {isOpen ? "Lihat Jadwal & Pesan" : "Tutup Sementara"}
          </div>
        </div>
      </div>
    </Link>
  );
}
