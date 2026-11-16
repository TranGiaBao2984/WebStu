import { listPublicPortfolioPhotos } from "@/features/portfolio/queries";
import { CustomerPortfolioClient } from "@/components/customer/customer-portfolio-client";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export const revalidate = 3600;

export default async function CustomerAlbumsPage() {
  let photos: PortfolioPhoto[] = [];
  try {
    photos = await listPublicPortfolioPhotos();
  } catch {
    photos = [];
  }

  return <CustomerPortfolioClient photos={photos} />;
}