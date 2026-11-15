/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { MainGroup, PortfolioPhoto } from "@/features/portfolio/types";
import {
  deletePortfolioAlbumAction,
  deletePortfolioPhotoAction,
  renamePortfolioAlbumAction,
  savePortfolioPhotoAction,
  uploadPortfolioImageAction,
} from "@/features/portfolio/actions";

async function compressImageToFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 1600;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Không thể xử lý ảnh"));
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            resolve(new File([blob], cleanName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.86
        );
      };
      img.onerror = () => reject(new Error("File ảnh bị lỗi"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsDataURL(file);
  });
}

export function PortfolioClient({
  initialPhotos,
  dbError,
}: {
  initialPhotos: PortfolioPhoto[];
  dbError: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filterGroup, setFilterGroup] = useState<"ALL" | MainGroup>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(dbError);

  // Modal Thêm / Sửa ảnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [group, setGroup] = useState<MainGroup>("Concept");
  const [album, setAlbum] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Modal Đổi tên Album
  const [renameTarget, setRenameTarget] = useState<{
    group: MainGroup;
    oldName: string;
  } | null>(null);
  const [newAlbumName, setNewAlbumName] = useState("");

  const groupedAlbums = useMemo(() => {
    const groups: MainGroup[] = ["Concept", "Ngoại cảnh"];
    return groups
      .filter((g) => filterGroup === "ALL" || filterGroup === g)
      .map((g) => {
        const groupPhotos = initialPhotos.filter((p) => p.group_name === g);
        const albumMap = new Map<string, PortfolioPhoto[]>();
        groupPhotos.forEach((item) => {
          const list = albumMap.get(item.album_name) || [];
          list.push(item);
          albumMap.set(item.album_name, list);
        });
        return {
          groupName: g,
          albums: Array.from(albumMap.entries()).map(([albumName, items]) => ({
            albumName,
            items,
          })),
        };
      });
  }, [initialPhotos, filterGroup]);

  const existingAlbumsForGroup = useMemo(() => {
    return Array.from(
      new Set(
        initialPhotos
          .filter((p) => p.group_name === group)
          .map((p) => p.album_name)
      )
    );
  }, [initialPhotos, group]);

  const openAddModal = (presetGroup: MainGroup = "Concept", presetAlbum = "") => {
    setErrorMsg(null);
    setEditId(null);
    setGroup(presetGroup);
    setAlbum(presetAlbum);
    setTitle("");
    setUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (photo: PortfolioPhoto) => {
    setErrorMsg(null);
    setEditId(photo.id);
    setGroup(photo.group_name);
    setAlbum(photo.album_name);
    setTitle(photo.title);
    setUrl(photo.image_url);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const compressedFile = await compressImageToFile(rawFile);
      const formData = new FormData();
      formData.append("file", compressedFile);
      const res = await uploadPortfolioImageAction(formData);
      setUrl(res.url);
      if (!title) {
        setTitle(rawFile.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi tải ảnh lên.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!album.trim() || !title.trim() || !url.trim()) return;

    setErrorMsg(null);
    startTransition(async () => {
      try {
        await savePortfolioPhotoAction({
          id: editId ?? undefined,
          group_name: group,
          album_name: album,
          title,
          image_url: url,
        });
        setIsModalOpen(false);
        router.refresh();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Không thể lưu ảnh.");
      }
    });
  };

  const handleDeletePhoto = (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này khỏi Portfolio?")) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await deletePortfolioPhotoAction(id);
        router.refresh();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Không thể xóa ảnh.");
      }
    });
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !newAlbumName.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await renamePortfolioAlbumAction(
          renameTarget.group,
          renameTarget.oldName,
          newAlbumName
        );
        setRenameTarget(null);
        router.refresh();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Không thể đổi tên album.");
      }
    });
  };

  const handleDeleteAlbum = (targetGroup: MainGroup, albumName: string) => {
    if (!confirm(`Xóa toàn bộ album "${albumName}" và tất cả ảnh bên trong?`)) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await deletePortfolioAlbumAction(targetGroup, albumName);
        router.refresh();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Không thể xóa album.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trang Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý Concept, Ngoại cảnh và các Album hiển thị công khai tại /customer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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

      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Thông báo hệ thống</p>
            <p className="text-xs opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

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
            {tab === "ALL" ? `Tất cả (${initialPhotos.length} ảnh)` : tab}
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
                Chưa có album nào trong mục <strong>{groupName}</strong>. Nhấn{" "}
                <strong>+ Tạo Album {groupName}</strong> để bắt đầu.
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
                        <p className="text-xs text-muted-foreground">
                          {items.length} hình ảnh
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openAddModal(groupName, albumName)}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition cursor-pointer"
                        >
                          + Thêm ảnh vào album
                        </button>
                        <button
                          onClick={() => {
                            setRenameTarget({ group: groupName, oldName: albumName });
                            setNewAlbumName(albumName);
                          }}
                          className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent/80 transition cursor-pointer"
                        >
                          Đổi tên album
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleDeleteAlbum(groupName, albumName)}
                          className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition cursor-pointer disabled:opacity-50"
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
                            src={photo.image_url}
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
                                disabled={isPending}
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="Xóa ảnh"
                                className="rounded-md bg-destructive p-1.5 text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
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

      {/* MODAL THÊM / SỬA ẢNH */}
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
                  {existingAlbumsForGroup.map((a) => (
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
                  Tải ảnh lên Supabase Storage
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {isUploading && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang tối ưu & tải ảnh lên cloud...
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Link ảnh (Tự điền khi upload hoặc dán URL ngoài)
                </label>
                <input
                  type="url"
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
                  disabled={isUploading || isPending || !url}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editId !== null ? "Lưu thay đổi" : "Thêm vào Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI TÊN ALBUM */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold">Đổi tên Album</h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Phân mục: {renameTarget.group}
            </p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="rounded-lg bg-accent px-3.5 py-2 text-xs font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 cursor-pointer"
                >
                  Cập nhật tên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
