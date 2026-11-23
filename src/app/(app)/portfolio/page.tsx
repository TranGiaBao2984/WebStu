import { listPortfolioPhotos, listPortfolioAlbumMeta } from "@/features/portfolio/queries";
import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export default async function PortfolioManagerPage() {
  const [metaResult, photosResult] = await Promise.allSettled([
    listPortfolioAlbumMeta(),
    listPortfolioPhotos(),
  ]);

  const albumMeta = metaResult.status === "fulfilled" ? metaResult.value : [];
  const photos: PortfolioPhoto[] =
    photosResult.status === "fulfilled" ? photosResult.value : [];

  return <PortfolioClient initialPhotos={photos} initialAlbumMeta={albumMeta} />;
}