import { listPortfolioPhotos } from "@/features/portfolio/queries";
import { PortfolioClient } from "@/components/portfolio/portfolio-client";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export default async function PortfolioManagerPage() {
  let photos: PortfolioPhoto[] = [];
  let dbError: string | null = null;

  try {
    photos = await listPortfolioPhotos();
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dbError =
      err instanceof Error
        ? err.message
        : "Chưa kết nối được bảng portfolio_photos trên Supabase.";
  }

  return <PortfolioClient initialPhotos={photos} />;
}
