/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type AlbumSummary,
  groupPhotosByAlbum,
  type MainGroup,
  type PortfolioPhoto,
} from "@/features/portfolio/types";

function AlbumCard({ album }: { album: AlbumSummary }) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || album.photos.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewIdx((prev) => (prev + 1) % album.photos.length);
    }, 1100);
    return () => clearInterval(timer);
  }, [isHovered, album.photos.length]);

  const activeIdx = isHovered ? previewIdx : 0;
  const activePhoto = album.photos[activeIdx] || album.photos[0];

  return (
    <Link
      href={`/customer/${encodeURIComponent(album.name)}?group=${encodeURIComponent(album.group)}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPreviewIdx(0);
      }}
      className="group block"
    >
      <div className="relative aspect-2/3 overflow-hidden bg-[#1f1b16] border border-[#F7F3E4]/10">
        <img
          src={activePhoto?.image_url}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {album.photos.length > 1 && (
          <div className="absolute top-3 inset-x-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {album.photos.slice(0, 6).map((p, idx) => (
              <div
                key={p.id}
                className={`h-0.5 flex-1 transition-colors ${
                  idx === activeIdx % Math.min(album.photos.length, 6)
                    ? "bg-[#F7F3E4]"
                    : "bg-[#F7F3E4]/30"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-[#171410]/85 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity flex flex-col justify-end p-6">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#a39e93] mb-1">
            {isHovered ? "Đang xem trước • Nhấn để mở" : `${album.count} tác phẩm`}
          </span>
          <div className="flex items-center justify-between gap-3">
            <h3 className="[font-family:var(--font-customer-serif),serif] text-2xl font-medium tracking-normal text-[#F7F3E4]">
              {album.name}
            </h3>
            <span className="text-sm text-[#F7F3E4] shrink-0 transform translate-x-0 group-hover:translate-x-1.5 transition-transform">
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GroupSection({
  id,
  subtitle,
  title,
  albums,
}: {
  id: string;
  subtitle: string;
  title: string;
  albums: AlbumSummary[];
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#F7F3E4]/15 pb-4 mb-8 gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#a39e93] mb-1">
            {subtitle}
          </p>
          <h2 className="[font-family:var(--font-customer-serif),serif] text-3xl md:text-4xl font-normal tracking-normal">
            {title}
          </h2>
        </div>
        <span className="text-xs uppercase tracking-widest text-[#a39e93]">
          {albums.length} Album
        </span>
      </div>

      {albums.length === 0 ? (
        <p className="text-sm text-[#a39e93] py-10">
          Chưa có album nào trong mục {title}.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album) => (
            <AlbumCard key={`${album.group}-${album.name}`} album={album} />
          ))}
        </div>
      )}
    </section>
  );
}

export function CustomerPortfolioClient({
  photos,
}: {
  photos: PortfolioPhoto[];
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | MainGroup>("ALL");

  const conceptAlbums = useMemo(
    () => groupPhotosByAlbum(photos, "Concept"),
    [photos]
  );
  const outdoorAlbums = useMemo(
    () => groupPhotosByAlbum(photos, "Ngoại cảnh"),
    [photos]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#171410] text-[#F7F3E4]">
      <header className="grid grid-cols-1 md:grid-cols-3 items-center px-[3vw] py-7 border-b border-[#F7F3E4]/10 sticky top-0 bg-[#171410]/95 backdrop-blur-md z-40 gap-3">
        <div className="hidden md:block [font-family:var(--font-customer-serif),serif] text-base tracking-wide">
          Ni Image
        </div>

        <h1 className="[font-family:var(--font-customer-serif),serif] text-xl md:text-2xl tracking-[0.14em] uppercase text-center">
          {"NI'S IMAGES"}
        </h1>

        <nav className="flex justify-center md:justify-end gap-5 text-xs uppercase tracking-widest">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`pb-1 border-b transition-colors cursor-pointer ${
              activeTab === "ALL"
                ? "text-[#F7F3E4] border-[#F7F3E4]"
                : "text-[#a39e93] border-transparent hover:text-[#F7F3E4]"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("Concept")}
            className={`pb-1 border-b transition-colors cursor-pointer ${
              activeTab === "Concept"
                ? "text-[#F7F3E4] border-[#F7F3E4]"
                : "text-[#a39e93] border-transparent hover:text-[#F7F3E4]"
            }`}
          >
            Concepts
          </button>
          <button
            onClick={() => setActiveTab("Ngoại cảnh")}
            className={`pb-1 border-b transition-colors cursor-pointer ${
              activeTab === "Ngoại cảnh"
                ? "text-[#F7F3E4] border-[#F7F3E4]"
                : "text-[#a39e93] border-transparent hover:text-[#F7F3E4]"
            }`}
          >
            Ngoại cảnh
          </button>
        </nav>
      </header>

      <div className="text-center pt-12 pb-10 px-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#a39e93] mb-2">
          Portfolio Collections
        </p>
      </div>

      <main className="flex-1 max-w-350 w-full mx-auto px-[4vw] pb-24 space-y-20">
        {(activeTab === "ALL" || activeTab === "Concept") && (
          <GroupSection
            id="concepts-section"
            subtitle="01 / Studio & Creative"
            title="Concepts"
            albums={conceptAlbums}
          />
        )}

        {(activeTab === "ALL" || activeTab === "Ngoại cảnh") && (
          <GroupSection
            id="outdoor-section"
            subtitle="02 / Natural Light & Outdoor"
            title="Ngoại cảnh"
            albums={outdoorAlbums}
          />
        )}
      </main>

      <footer className="flex flex-col sm:flex-row justify-between items-center px-[3vw] py-8 border-t border-[#F7F3E4]/10 text-xs text-[#a39e93] gap-2">
        <div>{"© 2026 NI'S IMAGES. All rights reserved."}</div>
        <div>Fine Art & Portrait Photography</div>
      </footer>
    </div>
  );
}
