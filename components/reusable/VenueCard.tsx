import Link from "next/link";
import { HiHome, HiOutlineMapPin, HiOutlineTicket } from "react-icons/hi2";

interface VenueProps {
  venue: {
    id: string | number;
    name: string;
    city: string;
    // TAMBAHAN: Pastikan tipe data ini dimasukkan agar bisa dibaca dari backend
    district?: string;
    address?: string;
    thumbnailUrl?: string;
    images?: any[];
    ratings?: any[];
    fields?: any[];
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
  const formatPrice = (price: number) =>
    `Rp. ${price?.toLocaleString("id-ID")}`;

  const getMinPrice = (fields?: any[]) => {
    if (!fields?.length) return 0;
    return Math.min(...fields.map((f) => f.price));
  };

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

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="group block bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition relative cursor-pointer flex flex-col h-full">
      {/* Promo Badge */}
      {isPromo && (
        <div className="absolute top-3 right-3 z-10 bg-[#7c3aed] text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-md uppercase tracking-wide">
          <HiOutlineTicket size={14} className="rotate-[-10deg]" />
          <span>PROMO</span>
          {promoDiscount && (
            <span className="border-l border-white/30 ml-1 pl-1.5">
              {promoDiscount}%
            </span>
          )}
        </div>
      )}

      <div className="aspect-video bg-gray-100 overflow-hidden relative">
        <img
          src={
            venue.thumbnailUrl ||
            venue.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400"
          }
          alt={venue.name}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex text-lg mb-1">
          {renderStars(getAvgRating(venue.ratings))}
        </div>

        <h3 className="font-bold text-black text-lg uppercase leading-tight">
          {venue.name}
        </h3>

        {/* INFO KOTA & LAPANGAN (Icon Rumah) */}
        <p className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-0.5 truncate">
          <HiHome size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {venue.city} · {venue.fields?.[0]?.type || "Olahraga"} ·
            <span className="font-semibold text-xs text-primary ml-1">
              {venue.fields?.length || 0} Lapangan
            </span>
          </span>
        </p>

        {/* INFO KECAMATAN / ALAMAT LENGKAP (Icon Map Pin) */}
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate">
          <HiOutlineMapPin size={12} className="shrink-0" />
          <span className="truncate">
            {venue.district || venue.address || "Lokasi belum tersedia"}
          </span>
        </p>

        <p className="text-xs text-slate-400 mt-1">
          Harga mulai
          <span className="text-primary font-bold ml-1">
            {formatPrice(getMinPrice(venue.fields))}
          </span>
        </p>

        {/* PREVIEW JADWAL LAPANGAN (Hanya muncul jika showFieldPreview=true) */}
        {showFieldPreview && venue.fields?.[0] && (
          <div className="mt-2 pt-2 border-t border-gray-50">
            <p className="text-xs font-semibold text-gray-700">
              {venue.fields[0].name}
            </p>
            <p className="text-[10px] text-gray-500">
              {venue.fields[0].type} · P {venue.fields[0].length} x L{" "}
              {venue.fields[0].width}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
                <span
                  key={h}
                  className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="block text-center py-2 md:py-1.5 border border-gray-300 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500 transition group-hover:border-primary group-hover:text-primary">
            Lihat Selengkapnya
          </div>
        </div>
      </div>
    </Link>
  );
}
