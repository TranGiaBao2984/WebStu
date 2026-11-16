/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpToLine,
  Check,
  ExternalLink,
  FolderOpen,
  GripVertical,
  ImagePlus,
  Link2,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import {
  deletePortfolioAlbumAction,
  deletePortfolioPhotoAction,
  renamePortfolioAlbumAction,
  reorderPortfolioPhotosAction,
  savePortfolioAlbumLinkAction,
  savePortfolioPhotoAction,
  uploadPortfolioImageAction,
} from "@/features/portfolio/actions";
import type {
  MainGroup,
  PortfolioAlbumMeta,
  PortfolioPhoto,
} from "@/features/portfolio/types";

const GROUP_OPTIONS: MainGroup[] = ["Concept", "Ngoại cảnh"];

function extractOriginalFilename(url: string): string {
  try {
    const cleanUrl = url.split("?")[0];
    const segments = cleanUrl.split("/");
    const lastSegment = decodeURIComponent(segments[segments.length - 1] || "");
    const hyphenIdx = lastSegment.indexOf("-");
    if (hyphenIdx !== -1 && hyphenIdx <= 15) {
      return lastSegment.slice(hyphenIdx + 1);
    }
    return lastSegment || "image.jpg";
  } catch {
    return "image.jpg";
  }
}

function slugifyAlbum(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 1.5 * 1024 * 1024 && file.type !== "image/png") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 2200;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export function PortfolioClient({
  initialPhotos,
  initialAlbumMeta = [],
}: {
  initialPhotos: PortfolioPhoto[];
  initialAlbumMeta?: PortfolioAlbumMeta[];
}) {
  const router = useRouter();
  const [optimisticOrder, setOptimisticOrder] = useState<Record<string, number>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [optimisticLinks, setOptimisticLinks] = useState<Record<string, string | null>>({});

  const photos = useMemo(() => {
    return initialPhotos
      .filter((p) => !hiddenIds.has(p.id))
      .map((p) =>
        p.id in optimisticOrder ? { ...p, sort_order: optimisticOrder[p.id] } : p
      );
  }, [initialPhotos, optimisticOrder, hiddenIds]);

  const albumLinkMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of initialAlbumMeta) {
      if (m.external_url) {
        map.set(`${m.group_name}::${m.album_name}`, m.external_url);
      }
    }
    for (const [k, v] of Object.entries(optimisticLinks)) {
      if (v) map.set(k, v);
      else map.delete(k);
    }
    return map;
  }, [initialAlbumMeta, optimisticLinks]);

  const [selectedGroup, setSelectedGroup] = useState<MainGroup>(GROUP_OPTIONS[0]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");

  // Kéo thả sắp xếp
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Tải lên nhiều ảnh
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    label: string;
  } | null>(null);
  const [newAlbumInput, setNewAlbumInput] = useState("");
  const [newAlbumExternalUrl, setNewAlbumExternalUrl] = useState("");
  const [isCreatingAlbumMode, setIsCreatingAlbumMode] = useState(false);

  // Popup gán & mở link cho từng Album khi bấm "Mở link Album"
  const [isAlbumLinkModalOpen, setIsAlbumLinkModalOpen] = useState(false);
  const [albumLinkDraft, setAlbumLinkDraft] = useState("");

  // Modal chỉnh sửa chi tiết ảnh
  const [editingPhoto, setEditingPhoto] = useState<PortfolioPhoto | null>(null);
  const [editGroup, setEditGroup] = useState<MainGroup>(GROUP_OPTIONS[0]);
  const [editAlbum, setEditAlbum] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [isReplacingFile, setIsReplacingFile] = useState(false);

  // Lightbox xem ảnh lớn
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const albumsInGroup = useMemo(() => {
    const map = new Map<
      string,
      { name: string; count: number; coverUrl: string; photos: PortfolioPhoto[] }
    >();

    const groupPhotos = photos
      .filter((p) => p.group_name === selectedGroup)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    for (const item of groupPhotos) {
      const existing = map.get(item.album_name);
      if (!existing) {
        map.set(item.album_name, {
          name: item.album_name,
          count: 1,
          coverUrl: item.image_url,
          photos: [item],
        });
      } else {
        existing.count += 1;
        existing.photos.push(item);
      }
    }

    return Array.from(map.values());
  }, [photos, selectedGroup]);

  const resolvedSelectedAlbum = useMemo(() => {
    if (isCreatingAlbumMode) return "";
    if (albumsInGroup.length === 0) return "";
    const exists = albumsInGroup.some((a) => a.name === selectedAlbum);
    return exists ? selectedAlbum : albumsInGroup[0].name;
  }, [albumsInGroup, selectedAlbum, isCreatingAlbumMode]);

  const currentAlbumExternalUrl = resolvedSelectedAlbum
    ? albumLinkMap.get(`${selectedGroup}::${resolvedSelectedAlbum}`) || ""
    : "";

  const existingAlbumsForEditGroup = useMemo(() => {
    const names = new Set<string>();
    for (const p of photos) {
      if (p.group_name === editGroup) {
        names.add(p.album_name);
      }
    }
    return Array.from(names);
  }, [photos, editGroup]);

  const activeAlbumName = isCreatingAlbumMode
    ? newAlbumInput.trim()
    : resolvedSelectedAlbum;

  const activeAlbumPhotos = useMemo(() => {
    if (!activeAlbumName) return [];
    return photos
      .filter(
        (p) => p.group_name === selectedGroup && p.album_name === activeAlbumName
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [photos, selectedGroup, activeAlbumName]);

  const persistNewOrder = (reorderedAlbumList: PortfolioPhoto[]) => {
    const nextOrderMap: Record<string, number> = {};
    reorderedAlbumList.forEach((item, idx) => {
      nextOrderMap[item.id] = idx;
    });

    setOptimisticOrder((prev) => ({ ...prev, ...nextOrderMap }));

    startTransition(async () => {
      try {
        await reorderPortfolioPhotosAction(reorderedAlbumList.map((p) => p.id));
        flashStatus("Đã lưu vị trí mới");
        router.refresh();
      } catch (err) {
        setOptimisticOrder({});
        alert(err instanceof Error ? err.message : "Lỗi lưu thứ tự ảnh.");
      }
    });
  };

  const handleMoveIndex = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= activeAlbumPhotos.length
    ) {
      return;
    }

    const updated = [...activeAlbumPhotos];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    persistNewOrder(updated);
  };

  const handleDropOnCard = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIndex = activeAlbumPhotos.findIndex((p) => p.id === draggedId);
    const toIndex = activeAlbumPhotos.findIndex((p) => p.id === targetId);
    setDraggedId(null);
    setDragOverId(null);

    if (fromIndex !== -1 && toIndex !== -1) {
      handleMoveIndex(fromIndex, toIndex);
    }
  };

  const handleBatchUpload = async (fileList: FileList | File[]) => {
    const targetAlbum = activeAlbumName;
    if (!targetAlbum) {
      alert("Vui lòng chọn hoặc nhập tên Album trước khi tải ảnh lên.");
      return;
    }

    const imageFiles = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).");
      return;
    }

    if (isCreatingAlbumMode && newAlbumExternalUrl.trim()) {
      try {
        await savePortfolioAlbumLinkAction({
          group_name: selectedGroup,
          album_name: targetAlbum,
          external_url: newAlbumExternalUrl.trim(),
        });
      } catch {
        // Bỏ qua nếu chưa khởi tạo bảng portfolio_albums
      }
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const rawFile = imageFiles[i];
      setUploadProgress({
        current: i + 1,
        total: imageFiles.length,
        label: rawFile.name,
      });

      try {
        const readyFile = await compressImageIfNeeded(rawFile);
        const fd = new FormData();
        fd.append("file", readyFile);

        const { url } = await uploadPortfolioImageAction(fd);
        await savePortfolioPhotoAction({
          group_name: selectedGroup,
          album_name: targetAlbum,
          image_url: url,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Thất bại";
        alert(`Lỗi khi tải ảnh "${rawFile.name}": ${msg}`);
      }
    }

    setUploadProgress(null);
    if (isCreatingAlbumMode) {
      setIsCreatingAlbumMode(false);
      setSelectedAlbum(targetAlbum);
      setNewAlbumInput("");
      setNewAlbumExternalUrl("");
    }
    router.refresh();
  };

  // Bấm "Mở link Album" -> Mở Popup gán / xem / mở link của Album hiện tại
  const handleOpenAlbumLinkModal = () => {
    if (!resolvedSelectedAlbum) return;
    setAlbumLinkDraft(currentAlbumExternalUrl);
    setIsAlbumLinkModalOpen(true);
  };

  const handleSaveAlbumLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSelectedAlbum) return;

    const normalized = normalizeUrl(albumLinkDraft);
    const key = `${selectedGroup}::${resolvedSelectedAlbum}`;

    setOptimisticLinks((prev) => ({
      ...prev,
      [key]: normalized || null,
    }));
    setIsAlbumLinkModalOpen(false);

    startTransition(async () => {
      try {
        await savePortfolioAlbumLinkAction({
          group_name: selectedGroup,
          album_name: resolvedSelectedAlbum,
          external_url: albumLinkDraft.trim(),
        });
        flashStatus(
          normalized ? "Đã lưu link cho Album" : "Đã gỡ link khỏi Album"
        );
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Không thể lưu link Album.");
      }
    });
  };

  const handleRenameAlbum = () => {
    if (!resolvedSelectedAlbum) return;
    const nextName = prompt("Nhập tên mới cho Album:", resolvedSelectedAlbum);
    if (
      !nextName ||
      !nextName.trim() ||
      nextName.trim() === resolvedSelectedAlbum
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await renamePortfolioAlbumAction(
          selectedGroup,
          resolvedSelectedAlbum,
          nextName.trim()
        );
        setSelectedAlbum(nextName.trim());
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Không thể đổi tên album.");
      }
    });
  };

  const handleDeleteAlbum = () => {
    if (!resolvedSelectedAlbum) return;
    const ok = confirm(
      `Xóa toàn bộ Album "${resolvedSelectedAlbum}" cùng tất cả ảnh bên trong? Thao tác này không thể hoàn tác.`
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        await deletePortfolioAlbumAction(selectedGroup, resolvedSelectedAlbum);
        setSelectedAlbum("");
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Không thể xóa album.");
      }
    });
  };

  const handleDeletePhoto = (photo: PortfolioPhoto, index: number) => {
    const ok = confirm(`Xóa ảnh #${index + 1} khỏi Album "${photo.album_name}"?`);
    if (!ok) return;

    setHiddenIds((prev) => new Set(prev).add(photo.id));
    startTransition(async () => {
      try {
        await deletePortfolioPhotoAction(photo.id);
        router.refresh();
      } catch (err) {
        setHiddenIds((prev) => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
        alert(err instanceof Error ? err.message : "Không thể xóa ảnh.");
      }
    });
  };

  const openEditModal = (photo: PortfolioPhoto) => {
    setEditingPhoto(photo);
    setEditGroup(photo.group_name);
    setEditAlbum(photo.album_name);
    setEditUrl(photo.image_url);
  };

  const handleReplaceImageInModal = async (file: File) => {
    setIsReplacingFile(true);
    try {
      const ready = await compressImageIfNeeded(file);
      const fd = new FormData();
      fd.append("file", ready);
      const { url } = await uploadPortfolioImageAction(fd);
      setEditUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi tải ảnh thay thế.");
    } finally {
      setIsReplacingFile(false);
    }
  };

  const handleSaveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    startTransition(async () => {
      try {
        await savePortfolioPhotoAction({
          id: editingPhoto.id,
          group_name: editGroup,
          album_name: editAlbum,
          image_url: editUrl,
        });
        setEditingPhoto(null);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Không thể lưu thay đổi.");
      }
    });
  };

  const draftPreviewUrl = normalizeUrl(albumLinkDraft);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Portfolio</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Kéo thả để sắp xếp thứ tự hiển thị ảnh, tải lên hàng loạt theo từng Album và đồng bộ trực tiếp ra trang khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {statusMessage && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              {statusMessage}
            </span>
          )}

          <Link
            href="/customer"
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Xem trang khách
          </Link>
        </div>
      </div>

      {/* Thanh chọn Nhóm danh mục chính */}
      <div className="flex flex-wrap items-center gap-2">
        {GROUP_OPTIONS.map((grp) => {
          const count = new Set(photos.filter((p) => p.group_name === grp).map((p) => p.album_name)).size;
          const active = grp === selectedGroup;
          return (
            <button
              key={grp}
              type="button"
              onClick={() => {
                setSelectedGroup(grp);
                setIsCreatingAlbumMode(false);
              }}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-all cursor-pointer ${
                active
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card border text-foreground hover:bg-accent"
              }`}
            >
              <span>{grp}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Khu vực quản lý Album & Tải ảnh nhanh */}
      <div className="rounded-2xl border bg-card p-5 space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Album:
            </span>

            {albumsInGroup.map((alb) => {
              const isSelected =
                !isCreatingAlbumMode && alb.name === resolvedSelectedAlbum;
              const hasLink = albumLinkMap.has(`${selectedGroup}::${alb.name}`);
              return (
                <button
                  key={alb.name}
                  type="button"
                  onClick={() => {
                    setIsCreatingAlbumMode(false);
                    setSelectedAlbum(alb.name);
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/12 text-primary ring-1 ring-primary/40"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>{alb.name}</span>
                  <span className="text-muted-foreground">({alb.count})</span>
                  {hasLink && (
                    <span
                      title="Album này đã được gắn link"
                      className="inline-flex items-center text-emerald-600"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setIsCreatingAlbumMode(true);
                setNewAlbumInput("");
                setNewAlbumExternalUrl("");
              }}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed px-3.5 text-xs font-medium transition-colors cursor-pointer ${
                isCreatingAlbumMode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              + Tạo Album mới
            </button>
          </div>

          {!isCreatingAlbumMode && resolvedSelectedAlbum && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAlbumLinkModal}
                disabled={isPending}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors cursor-pointer ${
                  currentAlbumExternalUrl
                    ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-muted/60 text-foreground hover:bg-muted"
                }`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Mở link Album</span>
                {currentAlbumExternalUrl && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={handleRenameAlbum}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-muted/60 px-3 text-xs font-medium hover:bg-muted cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Đổi tên Album
              </button>
              <button
                type="button"
                onClick={handleDeleteAlbum}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-destructive/10 px-3 text-xs font-medium text-destructive hover:bg-destructive/20 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa Album
              </button>
            </div>
          )}
        </div>

        {isCreatingAlbumMode && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-muted/40 p-3.5">
            <div>
              <label className="block text-xs font-medium mb-1">
                Tên Album mới trong nhóm <strong>{selectedGroup}</strong> *
              </label>
              <input
                type="text"
                value={newAlbumInput}
                onChange={(e) => setNewAlbumInput(e.target.value)}
                placeholder="VD: Nàng Thơ Mùa Thu 2026..."
                className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">
                  Link kho ảnh gốc của Album (tùy chọn)
                </label>
                <input
                  type="text"
                  value={newAlbumExternalUrl}
                  onChange={(e) => setNewAlbumExternalUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {albumsInGroup.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingAlbumMode(false)}
                  className="h-9 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vùng kéo thả / chọn nhiều ảnh tải lên hàng loạt */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFiles(true);
          }}
          onDragLeave={() => setIsDraggingFiles(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFiles(false);
            if (e.dataTransfer.files?.length) {
              handleBatchUpload(e.dataTransfer.files);
            }
          }}
          onClick={() => {
            if (!uploadProgress) fileInputRef.current?.click();
          }}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDraggingFiles
              ? "border-primary bg-primary/8"
              : "border-border/80 bg-muted/25 hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleBatchUpload(e.target.files);
                e.target.value = "";
              }
            }}
          />

          {uploadProgress ? (
            <div className="space-y-2 py-1">
              <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">
                Đang tối ưu & tải ảnh {uploadProgress.current}/{uploadProgress.total}...
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-xs mx-auto">
                {uploadProgress.label}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ImagePlus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">
                Kéo thả nhiều ảnh vào đây hoặc{" "}
                <span className="text-primary underline">bấm để chọn từ máy</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ chọn cùng lúc nhiều file (JPG, PNG, WEBP) • Tự động nén sắc nét & thêm vào{" "}
                <strong>{activeAlbumName || "Album mới"}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thanh hướng dẫn sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-primary shrink-0" />
          <span>
            Kéo thả thẻ ảnh để đổi vị trí hiển thị. Ảnh <strong>#1</strong> tự động làm ảnh bìa Album.
          </span>
        </div>
        {activeAlbumPhotos.length > 0 && (
          <span className="font-medium text-foreground">
            Tổng cộng: {activeAlbumPhotos.length} ảnh
          </span>
        )}
      </div>

      {/* Lưới ảnh */}
      {activeAlbumPhotos.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-2">
          <p className="text-sm font-medium">Chưa có ảnh nào trong mục này</p>
          <p className="text-xs text-muted-foreground">
            Hãy kéo thả hoặc chọn ảnh ở khung phía trên để bắt đầu xây dựng Album.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activeAlbumPhotos.map((photo, index) => {
            const isCover = index === 0;
            const isBeingDragged = draggedId === photo.id;
            const isDropTarget = dragOverId === photo.id && draggedId !== photo.id;

            return (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDraggedId(photo.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== photo.id) setDragOverId(photo.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === photo.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnCard(photo.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all cursor-grab active:cursor-grabbing ${
                  isBeingDragged ? "opacity-45 scale-[0.98]" : ""
                } ${
                  isDropTarget
                    ? "ring-2 ring-primary border-primary scale-[1.01]"
                    : "hover:border-foreground/25"
                }`}
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                  <img
                    src={photo.image_url}
                    alt={`${photo.album_name} - Ảnh ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103 select-none"
                    draggable={false}
                  />

                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md ${
                        isCover
                          ? "bg-primary text-primary-foreground"
                          : "bg-black/65 text-white"
                      }`}
                    >
                      <GripVertical className="h-3 w-3" />
                      {isCover ? "#1 Ảnh bìa" : `#${index + 1}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    title="Xem phóng to"
                    className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 cursor-pointer"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>

                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 rounded-xl bg-black/75 p-1.5 text-white backdrop-blur-md opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0 || isPending}
                      onClick={() => handleMoveIndex(index, index - 1)}
                      title="Di chuyển lên trước"
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>

                    {index > 0 ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMoveIndex(index, 0)}
                        title="Đưa lên đầu làm ảnh bìa"
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-white/15 px-2 text-xs font-medium hover:bg-white/25 cursor-pointer"
                      >
                        <ArrowUpToLine className="h-3 w-3" />
                        Làm bìa
                      </button>
                    ) : (
                      <span className="text-xs text-white/75 px-1">
                        Đang là ảnh bìa
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={
                        index === activeAlbumPhotos.length - 1 || isPending
                      }
                      onClick={() => handleMoveIndex(index, index + 1)}
                      title="Di chuyển ra sau"
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/20 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chân thẻ: hiển thị tên file gốc để dò trùng & nút Sửa / Xóa */}
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-medium text-foreground truncate"
                      title={extractOriginalFilename(photo.image_url)}
                    >
                      {extractOriginalFilename(photo.image_url)}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {photo.album_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(photo)}
                      title="Đổi Album / Danh mục / Thay ảnh"
                      className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo, index)}
                      title="Xóa ảnh"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup gán & mở link riêng cho từng Album */}
      {isAlbumLinkModalOpen && (
        <div
          onClick={() => setIsAlbumLinkModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveAlbumLink}
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate">
                  Link Album: {resolvedSelectedAlbum}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Danh mục: {selectedGroup} • Chỉ hiển thị cho Admin đối chiếu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAlbumLinkModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium">
                Đường dẫn kho ảnh gốc (Google Drive / Facebook / Flickr...)
              </label>
              <input
                type="text"
                value={albumLinkDraft}
                onChange={(e) => setAlbumLinkDraft(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Dán link vào ô trên rồi bấm <strong>Lưu link</strong>. Xóa trắng ô nếu muốn gỡ link.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              {draftPreviewUrl ? (
                <a
                  href={draftPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500/12 px-3.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Mở link ngay
                </a>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsAlbumLinkModalOpen(false)}
                  className="h-10 rounded-xl px-4 text-sm font-medium hover:bg-muted cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                >
                  Lưu link
                </button>
              </div>
            </div>

            <div className="pt-1 text-right">
              <Link
                href={`/customer/${slugifyAlbum(resolvedSelectedAlbum)}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                Mở trang khách của Album này
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Modal chỉnh sửa ảnh */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEditModal}
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Chỉnh sửa ảnh</h2>
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Danh mục chính
                  </label>
                  <select
                    value={editGroup}
                    onChange={(e) => setEditGroup(e.target.value as MainGroup)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  >
                    {GROUP_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    Tên Album
                  </label>
                  <input
                    type="text"
                    list="portfolio-album-suggestions"
                    required
                    value={editAlbum}
                    onChange={(e) => setEditAlbum(e.target.value)}
                    className="h-10 w-full rounded-xl border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <datalist id="portfolio-album-suggestions">
                    {existingAlbumsForEditGroup.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Thay tệp ảnh khác (tùy chọn)
                </label>
                <label className="flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-3 text-xs font-medium hover:bg-muted/60 cursor-pointer">
                  {isReplacingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải ảnh mới...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Chọn ảnh mới từ thiết bị
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    disabled={isReplacingFile}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplaceImageInModal(f);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="h-10 rounded-xl px-4 text-sm font-medium hover:bg-muted cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending || isReplacingFile}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lightbox xem phóng to ảnh */}
      {lightboxIndex !== null && activeAlbumPhotos[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-4xl flex flex-col items-center gap-3"
          >
            <img
              src={activeAlbumPhotos[lightboxIndex].image_url}
              alt={`${activeAlbumName} - Ảnh ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
            <p className="text-sm font-medium text-white">
              #{lightboxIndex + 1} / {activeAlbumPhotos.length} • {activeAlbumName}
            </p>
          </div>

          {lightboxIndex < activeAlbumPhotos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}