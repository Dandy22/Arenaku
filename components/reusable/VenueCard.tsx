import Link from "next/link";
import { HiHome, HiOutlineMapPin, HiOutlineTicket } from "react-icons/hi2";

interface VenueProps {
  venue: {
    id: string | number;
    name: string;
    city: string;
    images?: any[];
    ratings?: any[];
    fields?: any[];
  };
  isPromo?: boolean;
  promoDiscount?: number;
  showSlots?: boolean;
}

// Format enum type seperti MINI_SOCCER → Mini Soccer
const formatType = (type?: string) => {
  if (!type) return "Olahraga";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function VenueCard({
  venue,
  isPromo = false,
  promoDiscount,
  showSlots = false,
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

  const firstField = venue.fields?.[0];

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

        <p className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-0.5 truncate">
          <HiHome size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {venue.city} · {formatType(firstField?.type)} ·
            <span className="font-semibold text-xs text-primary ml-1">
              {venue.fields?.length || 0} Lapangan
            </span>
          </span>
        </p>

        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <HiOutlineMapPin size={12} /> {venue.city}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          Harga mulai
          <span className="text-primary font-bold ml-1">
            {formatPrice(getMinPrice(venue.fields))}
          </span>
        </p>

        {/* Slot jam — hanya tampil jika showSlots=true dan field tersedia */}
        {showSlots && firstField && (
          <div className="mt-1">
            <p className="text-xs font-semibold text-gray-700">
              {firstField.name}
            </p>
            <p className="text-xs text-slate-400">
              {formatType(firstField.type)}
              {firstField.length && firstField.width
                ? ` · P ${firstField.length} x L ${firstField.width}`
                : ""}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[8, 9, 10, 11, 12, 13, 14, 15].map((h) => (
                <span
                  key={h}
                  className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-2">
          <div className="block text-center py-2 md:py-1.5 border border-gray-300 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500 transition group-hover:border-primary group-hover:text-primary">
            Lihat Selengkapnya
          </div>
        </div>
      </div>
    </Link>
  );
}