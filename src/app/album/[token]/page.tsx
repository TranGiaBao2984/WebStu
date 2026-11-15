import { getPublicAlbumByToken } from "@/features/albums/queries";
import { PublicAlbumClient } from "@/components/albums/public-album-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const album = await getPublicAlbumByToken(token);

  if (!album) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Không tìm thấy Album</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Đường dẫn chọn ảnh này không tồn tại, đã hết hạn hoặc đang ở chế độ nháp. Vui lòng liên hệ Studio để được cấp lại link mới.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PublicAlbumClient token={token} album={album} />;
}