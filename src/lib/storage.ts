export type MainGroup = "Concept" | "Ngoại cảnh";

export interface PhotoItem {
  id: number;
  title: string;
  group: MainGroup;
  album: string;
  url: string;
  category?: string;
}

export interface AlbumSummary {
  name: string;
  group: MainGroup;
  coverUrl: string;
  count: number;
  photos: PhotoItem[];
}

export const DEFAULT_PHOTOS: PhotoItem[] = [
  { id: 1, group: "Concept", album: "Nàng Thơ Studio", title: "Muse I", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" },
  { id: 2, group: "Concept", album: "Nàng Thơ Studio", title: "Muse II", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80" },
  { id: 3, group: "Concept", album: "Editorial Shadow", title: "Noir Light I", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" },
  { id: 4, group: "Concept", album: "Editorial Shadow", title: "Noir Light II", url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80" },
  { id: 5, group: "Concept", album: "Minimalist Lookbook", title: "Soft Tone I", url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80" },
  { id: 6, group: "Ngoại cảnh", album: "Hoàng Hôn Đà Lạt", title: "Golden Pine I", url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80" },
  { id: 7, group: "Ngoại cảnh", album: "Hoàng Hôn Đà Lạt", title: "Golden Pine II", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" },
  { id: 8, group: "Ngoại cảnh", album: "Nắng Sớm Phố Cổ", title: "Morning Street I", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80" },
  { id: 9, group: "Ngoại cảnh", album: "Nắng Sớm Phố Cổ", title: "Morning Street II", url: "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=800&q=80" },
];

const STORAGE_KEY = "hn_portfolio_photos";
let cachedRaw: string | null = null;
let cachedPhotos: PhotoItem[] = DEFAULT_PHOTOS;

export function getPhotos(): PhotoItem[] {
  if (typeof window === "undefined") return DEFAULT_PHOTOS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_PHOTOS;
  }
  if (raw === cachedRaw) {
    return cachedPhotos;
  }
  try {
    const parsed = JSON.parse(raw) as PhotoItem[];
    cachedRaw = raw;
    cachedPhotos = parsed.map((item) => ({
      ...item,
      group: item.group || (item.category === "Ngoại cảnh" ? "Ngoại cảnh" : "Concept"),
      album: item.album || item.category || "Bộ sưu tập chung",
    }));
    return cachedPhotos;
  } catch {
    return DEFAULT_PHOTOS;
  }
}

export function getServerPhotos(): PhotoItem[] {
  return DEFAULT_PHOTOS;
}

export function subscribePhotos(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener("hn_photos_updated", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("hn_photos_updated", handler);
  };
}

export function savePhotos(photos: PhotoItem[]): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(photos);
  cachedRaw = raw;
  cachedPhotos = photos;
  localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event("hn_photos_updated"));
}

export function getAlbumsByGroup(photos: PhotoItem[], targetGroup: MainGroup): AlbumSummary[] {
  const filtered = photos.filter((p) => p.group === targetGroup);
  const map = new Map<string, PhotoItem[]>();

  filtered.forEach((photo) => {
    const list = map.get(photo.album) || [];
    list.push(photo);
    map.set(photo.album, list);
  });

  return Array.from(map.entries()).map(([name, albumPhotos]) => ({
    name,
    group: targetGroup,
    coverUrl: albumPhotos[0]?.url || "",
    count: albumPhotos.length,
    photos: albumPhotos,
  }));
}
