/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export function AlbumDetailClient({
  albumName,
  displayGroup,
  albumPhotos,
}: {
  albumName: string;
  displayGroup: string;
  albumPhotos: PortfolioPhoto[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Tải trước ảnh kế tiếp và ảnh trước đó khi đang mở Lightbox để lướt không độ trễ
  useEffect(() => {
    if (lightboxIndex === null || albumPhotos.length <= 1) return;
    const nextIdx = (lightboxIndex + 1) % albumPhotos.length;
    const prevIdx = (lightboxIndex - 1 + albumPhotos.length) % albumPhotos.length;

    const nextImg = new window.Image();
    nextImg.src = albumPhotos[nextIdx].image_url;

    const prevImg = new window.Image();
    prevImg.src = albumPhotos[prevIdx].image_url;
  }, [lightboxIndex, albumPhotos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % albumPhotos.length : null
        );
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + albumPhotos.length) % albumPhotos.length
            : null
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, albumPhotos.length]);

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % albumPhotos.length);
  };

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      (lightboxIndex - 1 + albumPhotos.length) % albumPhotos.length
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171410] text-[#F7F3E4]">
      <header className="grid grid-cols-3 items-center px-3.5 sm:px-[3vw] py-4 sm:py-7 border-b border-[#F7F3E4]/10 sticky top-0 bg-[#171410]/95 backdrop-blur-md z-40">
        <div>
          <Link
            href="/customer"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs uppercase tracking-widest text-[#a39e93] hover:text-[#F7F3E4] transition-colors"
          >
            <span>←</span>
            <span>Quay lại</span>
          </Link>
        </div>

        <Link
          href="/customer"
          className="[font-family:var(--font-customer-serif),serif] text-sm sm:text-lg md:text-2xl tracking-[0.1em] sm:tracking-[0.14em] uppercase text-center truncate"
        >
          {"NI'S IMAGES"}
        </Link>

        <div className="flex justify-end text-[11px] sm:text-xs tracking-widest uppercase text-[#a39e93]">
          {albumPhotos.length} ảnh
        </div>
      </header>

      <section className="text-center pt-8 sm:pt-12 pb-6 sm:pb-10 px-4">
        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#a39e93] mb-2">
          <Link href="/customer" className="hover:text-[#F7F3E4]">
            Portfolio
          </Link>
          <span>/</span>
          <span className="text-[#F7F3E4]">{displayGroup}</span>
        </div>
        <h1 className="[font-family:var(--font-customer-serif),serif] text-2xl sm:text-3xl md:text-5xl font-normal tracking-normal px-2">
          {albumName}
        </h1>
      </section>

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-2 sm:px-[2.38vw] pb-16 sm:pb-20">
        {albumPhotos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#a39e93] mb-6">
              Không tìm thấy hình ảnh trong album này.
            </p>
            <Link
              href="/customer"
              className="border border-[#F7F3E4]/30 px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-[#F7F3E4] hover:text-[#171410] transition"
            >
              Quay lại chọn Album
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-0">
            {albumPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-[2/3] overflow-hidden bg-[#1f1b16] cursor-pointer"
              >
                <Image
                  src={photo.image_url}
                  alt={`${albumName} - ${index + 1}`}
                  fill
                  priority={index < 6}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  quality={82}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#171410]/80 via-transparent to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-6">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-[#a39e93]">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(albumPhotos.length).padStart(2, "0")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {lightboxIndex !== null && albumPhotos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
            const diff = touchStartXRef.current - endX;
            touchStartXRef.current = null;
            if (Math.abs(diff) > 45) {
              if (diff > 0) handleNext();
              else handlePrev();
            }
          }}
          className="fixed inset-0 bg-[#0f0d0a]/95 z-50 flex items-center justify-center p-3 sm:p-6 select-none"
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Đóng"
            className="absolute top-3 right-4 sm:top-6 sm:right-8 z-10 text-3xl sm:text-4xl text-[#F7F3E4]/75 hover:text-[#F7F3E4] p-2 cursor-pointer"
          >
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Ảnh trước"
            className="absolute left-1 sm:left-4 md:left-8 z-10 text-2xl sm:text-3xl text-[#F7F3E4]/75 hover:text-[#F7F3E4] p-3 sm:p-4 cursor-pointer"
          >
            ❮
          </button>
          <img
            onClick={(e) => e.stopPropagation()}
            src={albumPhotos[lightboxIndex].image_url}
            alt={`${albumName} - ${lightboxIndex + 1}`}
            className="max-w-[88vw] sm:max-w-[90vw] max-h-[76dvh] sm:max-h-[82vh] object-contain shadow-2xl"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Ảnh tiếp theo"
            className="absolute right-1 sm:right-4 md:right-8 z-10 text-2xl sm:text-3xl text-[#F7F3E4]/75 hover:text-[#F7F3E4] p-3 sm:p-4 cursor-pointer"
          >
            ❯
          </button>
          <div className="absolute bottom-4 sm:bottom-6 [font-family:var(--font-customer-serif),serif] text-sm sm:text-lg tracking-wide text-center px-4">
            {albumName}{" "}
            <span className="text-xs sm:text-sm text-[#a39e93] ml-1.5">
              ({lightboxIndex + 1} / {albumPhotos.length})
            </span>
          </div>
        </div>
      )}

      <footer className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-[3vw] py-6 sm:py-8 border-t border-[#F7F3E4]/10 text-xs text-[#a39e93] gap-2 text-center">
        <div>{"© 2026 NI'S IMAGES. All rights reserved."}</div>
        <div>Fine Art & Portrait Photography</div>
      </footer>
    </div>
  );
}