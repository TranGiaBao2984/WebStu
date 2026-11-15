import type { Metadata } from "next";
import { listAlbumPhotos } from "@/features/portfolio/queries";
import { AlbumDetailClient } from "@/components/customer/album-detail-client";

export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ group?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { group } = await searchParams;
  const albumName = decodeURIComponent(slug || "").normalize("NFC");
  const photos = await listAlbumPhotos(albumName, group);
  const cover = photos[0]?.image_url;

  return {
    title: `${albumName} | NI'S IMAGES`,
    description: `Bộ sưu tập ${albumName} — NI'S IMAGES`,
    openGraph: cover ? { images: [{ url: cover }] } : undefined,
  };
}

export default async function AlbumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ group?: string }>;
}) {
  const { slug } = await params;
  const { group } = await searchParams;

  const albumName = decodeURIComponent(slug || "").normalize("NFC");
  const groupParam = group ? decodeURIComponent(group).normalize("NFC") : null;

  const albumPhotos = await listAlbumPhotos(albumName, groupParam);
  const displayGroup = groupParam || albumPhotos[0]?.group_name || "Album";

  return (
    <AlbumDetailClient
      albumName={albumName}
      displayGroup={displayGroup}
      albumPhotos={albumPhotos}
    />
  );
}
