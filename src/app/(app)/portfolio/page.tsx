/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Plus, ExternalLink, RotateCcw, Pencil, Trash2 } from "lucide-react";
import {
  DEFAULT_PHOTOS,
  getPhotos,
  getServerPhotos,
  MainGroup,
  PhotoItem,
  savePhotos,
  subscribePhotos,
} from "@/lib/storage";

export default function PortfolioManagerPage() {
  const photos: PhotoItem[] = useSyncExternalStore<PhotoItem[]>(
    subscribePhotos,
    getPhotos,
    getServerPhotos
  );

  const [filterGroup, setFilterGroup] = useState<"ALL" | MainGroup>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [group, setGroup] = useState<MainGroup>("Concept");
  const [album, setAlbum] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const groupedAlbums = useMemo(() => {
    const groups: MainGroup[] = ["Concept", "Ngoại cảnh"];
    return groups
      .filter((g) => filterGroup === "ALL" || filterGroup === g)
      .map((g) => {
        const groupPhotos = photos.filter((p: PhotoItem) => p.group === g);
        const albumMap = new Map<string, PhotoItem[]>();
        groupPhotos.forEach((item: PhotoItem) => {
          const list = albumMap.get(item.album) || [];
          list.push(item);
          albumMap.set(item.album, list);
        });
        return {
          groupName: g,
          albums: Array.from(albumMap.entries()).map(([albumName, items]) => ({
            albumName,
            items,
          })),
        };
      });
  }, [photos, filterGroup]);

  const existingAlbumsForGroup = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        photos
          .filter((p: PhotoItem) => p.group === group)
          .map((p: PhotoItem) => p.album)
      )
    );
  }, [photos, group]);

  const openAddModal = (presetGroup: MainGroup = "Concept", presetAlbum = "") => {
    setEditId(null);
    setGroup(presetGroup);
    setAlbum(presetAlbum);
    setTitle("");
    setUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (photo: PhotoItem) => {
    setEditId(photo.id);
    setGroup(photo.group);
    setAlbum(photo.album);
    setTitle(photo.title);
    setUrl(photo.url);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1200;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setUrl(compressedDataUrl);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!album.trim() || !title.trim() || !url.trim()) return;

    let updated: PhotoItem[];
    if (editId !== null) {
      updated = photos.map((p: PhotoItem) =>
        p.id === editId
          ? { id: editId, group, album: album.trim(), title: title.trim(), url: url.trim() }
          : p
      );
    } else {
      const newItem: PhotoItem = {
        id: Date.now(),
        group,
        album: album.trim(),
        title: title.trim(),
        url: url.trim(),
      };
      updated = [newItem, ...photos];
    }

    savePhotos(updated);
    setIsModalOpen(false);
  };

  const handleDeletePhoto = (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    savePhotos(photos.filter((p: PhotoItem) => p.id !== id));
  };

  const handleRenameAlbum = (targetGroup: MainGroup, oldName: string) => {
    const newName = prompt("Nhập tên mới cho Album:", oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const updated = photos.map((p: PhotoItem) =>
      p.group === targetGroup && p.album === oldName
        ? { ...p, album: newName.trim() }
        : p
    );
    savePhotos(updated);
  };

  const handleDeleteAlbum = (targetGroup: MainGroup, albumName: string) => {
    if (!confirm(`Xóa toàn bộ album "${albumName}" và tất cả ảnh bên trong?`)) return;
    const updated = photos.filter(
      (p: PhotoItem) => !(p.group === targetGroup && p.album === albumName)
    );
    savePhotos(updated);
  };

  const handleResetDefault = () => {
    if (!confirm("Khôi phục lại dữ liệu mẫu ban đầu?")) return;
    savePhotos(DEFAULT_PHOTOS);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý Concept, Ngoại cảnh và các Album hiển thị cho khách tại /customer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Khôi phục mẫu
          </button>

          <Link
            href="/customer"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition"
          >
            <span>Xem trang khách</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={() => openAddModal("Concept", "")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Thêm ảnh / Album
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["ALL", "Concept", "Ngoại cảnh"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterGroup(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition cursor-pointer ${
              filterGroup === tab
                ? "bg-primary text-primary-foreground"
                : "border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? `Tất cả (${photos.length} ảnh)` : tab}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {groupedAlbums.map(({ groupName, albums }) => (
          <section key={groupName} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-6 w-1.5 rounded-full bg-primary" />
                <h2 className="text-lg font-bold">{groupName}</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {albums.length} Album
                </span>
              </div>

              <button
                onClick={() => openAddModal(groupName, "")}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                + Tạo Album {groupName}
              </button>
            </div>

            {albums.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                Chưa có album nào trong mục <strong>{groupName}</strong>.
              </div>
            ) : (
              <div className="space-y-5">
                {albums.map(({ albumName, items }) => (
                  <div
                    key={albumName}
                    className="rounded-xl border bg-card p-5 shadow-xs"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3.5">
                      <div>
                        <h3 className="text-base font-semibold">{albumName}</h3>
                        <p className="text-xs text-muted-foreground">{items.length} hình ảnh</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openAddModal(groupName, albumName)}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition cursor-pointer"
                        >
                          + Thêm ảnh vào album
                        </button>
                        <button
                          onClick={() => handleRenameAlbum(groupName, albumName)}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent/80 transition cursor-pointer"
                        >
                          Đổi tên album
                        </button>
                        <button
                          onClick={() => handleDeleteAlbum(groupName, albumName)}
                          className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition cursor-pointer"
                        >
                          Xóa album
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                      {items.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative aspect-[2/3] overflow-hidden rounded-lg border bg-muted"
                        >
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex flex-col justify-between bg-black/65 p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditModal(photo)}
                                title="Sửa ảnh"
                                className="rounded-md bg-white p-1.5 text-slate-900 hover:bg-slate-100 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="Xóa ảnh"
                                className="rounded-md bg-destructive p-1.5 text-white hover:opacity-90 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="truncate text-xs font-medium text-white">
                              {photo.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editId !== null ? "Chỉnh sửa hình ảnh" : "Thêm ảnh mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xl text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Phân mục chính
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as MainGroup)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="Concept">Concept</option>
                  <option value="Ngoại cảnh">Ngoại cảnh</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Tên Album (Chọn có sẵn hoặc nhập tên mới)
                </label>
                <input
                  type="text"
                  list="album-suggestions"
                  required
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="VD: Nàng Thơ Studio, Hoàng Hôn Đà Lạt..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <datalist id="album-suggestions">
                  {existingAlbumsForGroup.map((a: string) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Tên tác phẩm / Tiêu đề ảnh
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Muse I"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Tải ảnh từ máy tính
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {isUploading && (
                  <p className="mt-1 text-xs text-primary">Đang xử lý ảnh...</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Hoặc dán Link ảnh (URL)
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {url && (
                <div className="h-44 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-medium hover:bg-accent/80 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {editId !== null ? "Lưu thay đổi" : "Thêm vào Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
