import Link from "next/link";

interface PromoCardProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function PromoCard({
  title,
  description,
  ctaText = "Lihat Promo",
  ctaLink = "/venues",
}: PromoCardProps) {
  return (
    <Link href={ctaLink} className="block h-full">
      <div
        // FIX: Ubah min-h-[450px] jadi min-h-[320px]
        className="relative flex flex-col justify-end h-full rounded-lg overflow-hidden cursor-pointer group min-h-[320px] p-6"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
        }}>
        {/* Circle Atas */}
        <img
          alt="circle"
          src="/Circle.svg"
          className="absolute -top-70 -left-40 w-[150%] max-w-[500px] opacity-80 pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
        />

        {/* Circle Bawah */}
        <img
          alt="circle"
          src="/CircleHalf.svg"
          className="absolute -bottom-16 -right-16 w-[250px] opacity-60 group-hover:scale-105 pointer-events-none select-none"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col mt-auto text-white">
          <img
            src="LOGO-ARENAKU.svg"
            alt="Arenaku Logo"
            className="w-[100] mb-3"
          />
          {/* FIX: Perkecil dikit textnya biar pas di box yg lebih pendek */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-2 pr-2">
            {title}
          </h3>
          <p className="text-xs md:text-sm opacity-90 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.05] transition duration-300 z-20 pointer-events-none" />
      </div>
    </Link>
  );
}
