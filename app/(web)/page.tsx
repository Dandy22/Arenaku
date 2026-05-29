"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
  HiOutlineTag,
} from "react-icons/hi2";
import api from "@/lib/axios";
import { BEKASI_DISTRICTS, EVENT_CATEGORIES } from "@/lib/constants";
import { Select, DatePicker } from "antd";
import dayjs from "dayjs";

// IMPORT KOMPONEN
import VenueCard from "@/components/reusable/VenueCard";
import PromoCard from "@/components/reusable/Promocard";
import Carousel from "@/components/reusable/Carousel";
import EventCard from "@/components/reusable/EventCard";

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [promoVenues, setPromoVenues] = useState<any[]>([]);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchDate, setSearchDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);

  // FETCH DATA DARI API
  useEffect(() => {
    setIsMounted(true);
    setLoading(true);
    Promise.all([
      api.get("/venues?limit=4"),
      api.get("/events?limit=4"),
      api.get("/venues?limit=3&filter=promo"), // Untuk promo venues
    ])
      .then(([venuesRes, eventsRes, promoRes]) => {
        setVenues(venuesRes.data.data || venuesRes.data);
        setEvents(eventsRes.data.data || eventsRes.data);
        setPromoVenues(promoRes.data.data || promoRes.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // Fallback ke dummy data jika API error
        setVenues([]);
        setEvents([]);
        setPromoVenues([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchDistrict) params.set("district", searchDistrict);
    if (searchType) params.set("type", searchType);
    if (searchDate) params.set("date", searchDate);
    router.push(`/venues?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO SECTIONS */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <img
          src="/Hero.png"
          alt="hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Main Lebih Seru di Venue Terbaik!
          </h1>
        </div>
      </section>

      {/* SEARCH BAR */}
      <section className="relative z-30 -mt-20 px-4 overflow-hidden shadow-none">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-2xl shadow-xl overflow-hidden min-h-[160px] py-8 px-6"
            style={{ background: "linear-gradient(135deg, #5B21B6, #9333EA)" }}>
            <img
              alt="circle"
              src="/CircleHalf.svg"
              className="absolute right-0 -bottom-28 w-[300px] opacity-60 pointer-events-none select-none"
            />
            <img
              alt="circle"
              src="/Circle.svg"
              className="absolute left-[-330px] -bottom-5 w-[500px] opacity-60 pointer-events-none select-none"
            />

            <div className="relative flex flex-col items-center text-center gap-6">
              <p className="text-white text-1xl md:text-2xl font-bold tracking-tight">
                Temukan Lapangan Favoritmu Sekarang
              </p>

              <div className="flex flex-wrap justify-center gap-3 w-full">
                <div className="flex-1 min-w-[200px] h-[44px] bg-white rounded-xl px-4 flex items-center gap-2">
                  <HiOutlineMapPin className="text-primary shrink-0" />
                  {isMounted && (
                    <Select
                      placeholder="Pilih Kecamatan"
                      variant="borderless"
                      className="flex-1 text-sm font-semibold"
                      value={searchDistrict || undefined}
                      onChange={setSearchDistrict}
                      options={BEKASI_DISTRICTS.slice(1)}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-[200px] h-[44px] bg-white rounded-xl px-4 flex items-center gap-2">
                  <HiOutlineTag className="text-primary shrink-0" />
                  {isMounted && (
                    <Select
                      placeholder="Pilih Olahraga"
                      variant="borderless"
                      className="flex-1 text-sm font-semibold"
                      value={searchType || undefined}
                      onChange={setSearchType}
                      options={EVENT_CATEGORIES.slice(1)}
                    />
                  )}
                </div>

                <div className="flex-1 min-w-[200px] h-[44px] bg-white rounded-xl px-4 flex items-center gap-2">
                  <HiOutlineCalendar className="text-primary shrink-0" />
                  {isMounted && (
                    <DatePicker
                      variant="borderless"
                      className="flex-1 text-sm font-semibold"
                      value={searchDate ? dayjs(searchDate) : null}
                      suffixIcon={null}
                      onChange={(date) =>
                        setSearchDate(date ? date.format("YYYY-MM-DD") : "")
                      }
                      format="YYYY-MM-DD"
                      placeholder="Pilih tanggal"
                    />
                  )}
                </div>

                <button
                  onClick={handleSearch}
                  className="flex-1 min-w-[200px] h-[44px] px-6 cursor-pointer rounded-xl bg-[#EF4444] text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                  <HiOutlineMagnifyingGlass className="text-lg" />
                  Cek Jadwal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REKOMENDASI VENUE */}
      <section className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-black">
            Rekomendasi <span className="text-primary">Venue</span>
          </h2>
          <Link
            href="/venues"
            className="text-xs md:text-sm text-primary font-semibold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
            Lihat lebih lanjut →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-72 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>

      {/* PROMO VENUE  */}
      <section className="max-w-7xl mx-auto px-6 mt-16 mb-12">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-black">
            Promo <span className="text-primary">Venue</span>
          </h2>
          <Link
            href="/venues?filter=promo"
            className="text-xs md:text-sm text-primary font-semibold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
            Lihat lebih lanjut →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-80">
            <div className="bg-gray-100 rounded-2xl animate-pulse hidden md:block" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl animate-pulse h-72"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="w-full h-full">
                <PromoCard
                  title="Booking sekarang, penawaran terbaik."
                  description="Nikmati diskon hingga 50% untuk booking lapangan olahraga."
                  ctaText="Lihat Promo"
                  ctaLink="/venues?filter=promo"
                />
              </div>

              {promoVenues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
            <div className="block md:hidden w-full overflow-visible">
              <Carousel
                itemsToShow={1.2}
                gap={16}
                autoplay
                autoplayInterval={3000}>
                {promoVenues.map((venue) => (
                  <div key={venue.id} className="pb-4">
                    <VenueCard venue={venue} />
                  </div>
                ))}
              </Carousel>
            </div>
          </>
        )}
      </section>

      {/* AKTIVITAS KOMUNITAS */}
      <section
        className="mt-16 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
        }}>
        <img
          alt="circle"
          src="/circle.svg"
          className="absolute -top-70 -right-40  max-w-[500] opacity-60 group-hover:scale-105 pointer-events-none select-none"
        />

        <img
          alt="circle"
          src="/circle.svg"
          className="absolute -left-100 -bottom-60  max-w-[600] opacity-60 group-hover:scale-105 pointer-events-none select-none"
        />
        <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
          <h2 className="text-3xl font-semibold text-white mb-8">
            Aktivitas Komunitas
          </h2>

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar justify-between px-4">
            {EVENT_CATEGORIES.map((cat) => {
              if (cat.value === "OTHER") return null;
              let svgFileName = "Semua.svg";
              let displayLabel: string = cat.label;

              switch (cat.value) {
                case "":
                  svgFileName = "Semua.svg";
                  displayLabel = "Semua";
                  break;
                case "MINI_SOCCER":
                  svgFileName = "MiniSoccer.svg";
                  displayLabel = "Mini Soccer";
                  break;

                case "BADMINTON":
                  svgFileName = "BuluTangkis.svg";
                  displayLabel = "Bulu Tangkis";
                  break;
                case "BASKETBALL":
                  svgFileName = "Basket.svg";
                  displayLabel = "Basket";
                  break;
                case "TENNIS":
                  svgFileName = "Tenis.svg";
                  displayLabel = "Tenis";
                  break;
                case "VOLLEYBALL":
                  svgFileName = "Bola Voli.svg";
                  displayLabel = "Bola Voli";
                  break;
                case "PADEL":
                  svgFileName = "Padel.svg";
                  displayLabel = "Padel";
                  break;
                case "FUTSAL":
                  svgFileName = "SepakBola.svg";
                  displayLabel = "Futsal";
                  break;
                default:
                  svgFileName = "Semua.svg";
                  break;
              }
              return (
                <Link
                  key={cat.value}
                  href={`/activity?category=${cat.value}`}
                  className="group flex flex-col items-center gap-3 shrink-0 bg-transparent">
                  <div className="w-20 h-24 md:w-24 md:h-28 transition-transform group-hover:scale-105 shrink-0 bg-transparent">
                    <img
                      src={`/${svgFileName}`}
                      alt={displayLabel}
                      className="w-full h-full object-contain drop-shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/Semua.svg";
                      }}
                    />
                  </div>

                  <span className="text-white text-sm md:text-base font-medium tracking-wide whitespace-nowrap mt-1">
                    {displayLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACARA KOMUNITAS */}
      <section className="max-w-7xl mx-auto px-6 mt-12 mb-16">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-black">
            Acara <span className="text-primary">Komunitas</span>
          </h2>
          <Link
            href="/activity"
            className="text-xs md:text-sm text-primary font-semibold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
            Lihat lebih lanjut →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-2xl h-[400px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
