import { listAlbums } from "@/features/albums/queries";
import { listBookings } from "@/features/bookings/queries";
import { AlbumsClient } from "@/components/albums/albums-client";
import { vi } from "@/i18n/vi";

export default async function AlbumsPage() {
  const [albums, bookings] = await Promise.all([listAlbums(), listBookings()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{vi.nav.albums}</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý link ảnh gốc Google Drive, chia sẻ link chọn ảnh cho khách và nhận danh sách mã ảnh retouch
        </p>
      </div>

      <AlbumsClient albums={albums} bookings={bookings} />
    </div>
  );
}