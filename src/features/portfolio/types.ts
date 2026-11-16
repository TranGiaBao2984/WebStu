export type MainGroup = "Concept" | "Ngoại cảnh";

export interface PortfolioPhoto {
  id: string;
  group_name: MainGroup;
  album_name: string;
  title: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface AlbumSummary {
  name: string;
  group: MainGroup;
  coverUrl: string;
  count: number;
  photos: PortfolioPhoto[];
}

export function groupPhotosByAlbum(
  photos: PortfolioPhoto[],
  targetGroup: MainGroup
): AlbumSummary[] {
  const filtered = photos.filter((p) => p.group_name === targetGroup);
  const map = new Map<string, PortfolioPhoto[]>();

  filtered.forEach((photo) => {
    const list = map.get(photo.album_name) || [];
    list.push(photo);
    map.set(photo.album_name, list);
  });

  return Array.from(map.entries()).map(([name, albumPhotos]) => ({
    name,
    group: targetGroup,
    coverUrl: albumPhotos[0]?.image_url || "",
    count: albumPhotos.length,
    photos: albumPhotos,
  }));
}

export interface PortfolioAlbumMeta {
  id: string;
  group_name: MainGroup;
  album_name: string;
  external_url: string | null;
}