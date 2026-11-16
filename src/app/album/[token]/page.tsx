import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAlbumByToken } from "@/features/albums/queries";
import { PublicAlbumClient } from "@/components/albums/public-album-client";

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const album = await getPublicAlbumByToken(token);

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <PublicAlbumClient token={token} album={album} />
      </div>

      <footer className="border-t bg-muted/30 py-4 px-4 text-center text-xs text-muted-foreground">
        Bằng việc truy cập và gửi danh sách mã ảnh chọn, bạn xác nhận đồng ý để Studio xử lý thông tin phục vụ bàn giao ảnh theo{" "}
        <Link href="/privacy" target="_blank" className="underline text-foreground hover:text-primary">
          Chính sách Bảo vệ Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP)
        </Link>
        .
      </footer>
    </div>
  );
}