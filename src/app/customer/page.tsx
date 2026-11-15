import { listPortfolioPhotos } from "@/features/portfolio/queries";
import { CustomerPortfolioClient } from "@/components/customer/customer-portfolio-client";
import type { PortfolioPhoto } from "@/features/portfolio/types";

export const revalidate = 60;

export default async function CustomerAlbumsPage() {
  let photos: PortfolioPhoto[] = [];
  try {
    photos = await listPortfolioPhotos();
  } catch {
    photos = [];
  }

  return <CustomerPortfolioClient photos={photos} />;
}
