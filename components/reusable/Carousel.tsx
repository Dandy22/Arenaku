"use client";

import { useState, useEffect } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

interface CarouselProps {
  children: React.ReactNode[];
  itemsToShow?: number;
  gap?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
}

export default function Carousel({
  children,
  itemsToShow = 4,
  gap = 16,
  autoplay = false,
  autoplayInterval = 5000,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(autoplay);

  const totalItems = children.length;
  const itemsPerView = Math.min(itemsToShow, totalItems);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoplay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (totalItems - itemsPerView + 1));
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [isAutoplay, totalItems, itemsPerView, autoplayInterval]);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, totalItems - itemsPerView) : prev - 1,
    );
    setIsAutoplay(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev >= totalItems - itemsPerView ? 0 : prev + 1,
    );
    setIsAutoplay(false);
  };

  const maxIndex = Math.max(0, totalItems - itemsPerView);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxIndex;

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
            gap: `${gap}px`,
          }}>
          {children.map((child, index) => (
            <div
              key={index}
              style={{
                flex: `0 0 calc(${100 / itemsPerView}% - ${(gap * (itemsPerView - 1)) / itemsPerView}px)`,
              }}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {(canPrev || canNext) && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={!canPrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 p-2 rounded-full transition ${
              canPrev
                ? "bg-white shadow-md hover:bg-gray-50 text-gray-800 cursor-pointer"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Previous">
            <HiChevronLeft size={24} />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 p-2 rounded-full transition ${
              canNext
                ? "bg-white shadow-md hover:bg-gray-50 text-gray-800 cursor-pointer"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="Next">
            <HiChevronRight size={24} />
          </button>
        </>
      )}

      {/* Indicators (optional) */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition ${
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-gray-200 w-2 hover:bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
