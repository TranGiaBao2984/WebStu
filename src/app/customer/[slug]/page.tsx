import { listPublicPortfolioPhotos } from "@/features/portfolio/queries";
import { AlbumDetailClient } from "@/components/customer/album-detail-client";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export const revalidate = 3600;
export const dynamicParams = true;

function slugifyAlbum(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateStaticParams() {
  try {
    const photos = await listPublicPortfolioPhotos();
    const uniqueNames = Array.from(new Set(photos.map((p) => p.album_name)));
    return uniqueNames.map((name) => ({ slug: name }));
  } catch {
    return [];
  }
}

export default async function CustomerAlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).normalize("NFC").trim();
  const slugifiedTarget = slugifyAlbum(decodedSlug);

  let allPhotos: PortfolioPhoto[] = [];
  try {
    allPhotos = await listPublicPortfolioPhotos();
  } catch {
    allPhotos = [];
  }

  const albumPhotos = allPhotos
    .filter((p) => {
      const normalizedAlbum = p.album_name.normalize("NFC").trim();
      return (
        normalizedAlbum.toLowerCase() === decodedSlug.toLowerCase() ||
        slugifyAlbum(normalizedAlbum) === slugifiedTarget
      );
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const resolvedAlbumName = albumPhotos[0]?.album_name || decodedSlug;
  const displayGroup = albumPhotos[0]?.group_name || "Portfolio";

  return (
    <AlbumDetailClient
      albumName={resolvedAlbumName}
      displayGroup={displayGroup}
      albumPhotos={albumPhotos}
    />
  );
}