/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
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
      <header className="grid grid-cols-3 items-center px-[3vw] py-7 border-b border-[#F7F3E4]/10 sticky top-0 bg-[#171410]/95 backdrop-blur-md z-40">
        <div>
          <Link
            href="/customer"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#a39e93] hover:text-[#F7F3E4] transition-colors"
          >
            <span>←</span>
            <span>Quay lại</span>
          </Link>
        </div>

        <Link
          href="/customer"
          className="[font-family:var(--font-customer-serif),serif] text-lg md:text-2xl tracking-[0.14em] uppercase text-center truncate"
        >
          {"NI'S IMAGES"}
        </Link>

        <div className="flex justify-end text-xs tracking-widest uppercase text-[#a39e93]">
          {albumPhotos.length} ảnh
        </div>
      </header>

      <section className="text-center pt-12 pb-10 px-4">
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#a39e93] mb-2">
          <Link href="/customer" className="hover:text-[#F7F3E4]">
            Portfolio
          </Link>
          <span>/</span>
          <span className="text-[#F7F3E4]">{displayGroup}</span>
        </div>
        <h1 className="[font-family:var(--font-customer-serif),serif] text-3xl md:text-5xl font-normal tracking-normal">
          {albumName}
        </h1>
      </section>

      <main className="flex-1 max-w-[1700px] w-full mx-auto px-[2.38vw] pb-20">
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
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#171410]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#a39e93]">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(albumPhotos.length).padStart(2, "0")}
                  </span>
                  <h3 className="[font-family:var(--font-customer-serif),serif] text-xl mt-0.5">
                    {photo.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {lightboxIndex !== null && albumPhotos[lightboxIndex] && (
        <div className="fixed inset-0 bg-[#0f0d0a]/95 z-50 flex items-center justify-center p-6">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-8 text-4xl text-[#F7F3E4]/70 hover:text-[#F7F3E4] cursor-pointer"
          >
            ×
          </button>
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 text-3xl text-[#F7F3E4]/70 hover:text-[#F7F3E4] p-4 cursor-pointer"
          >
            ❮
          </button>
          <img
            src={albumPhotos[lightboxIndex].image_url}
            alt={albumPhotos[lightboxIndex].title}
            className="max-w-[90vw] max-h-[82vh] object-contain shadow-2xl"
          />
          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 text-3xl text-[#F7F3E4]/70 hover:text-[#F7F3E4] p-4 cursor-pointer"
          >
            ❯
          </button>
          <div className="absolute bottom-6 [font-family:var(--font-customer-serif),serif] text-lg tracking-wide">
            {albumPhotos[lightboxIndex].title}{" "}
            <span className="text-sm text-[#a39e93] ml-2">
              ({lightboxIndex + 1} / {albumPhotos.length})
            </span>
          </div>
        </div>
      )}

      <footer className="flex flex-col sm:flex-row justify-between items-center px-[3vw] py-8 border-t border-[#F7F3E4]/10 text-xs text-[#a39e93] gap-2">
        <div>{"© 2026 NI'S IMAGES. All rights reserved."}</div>
        <div>Fine Art & Portrait Photography</div>
      </footer>
    </div>
  );
}
