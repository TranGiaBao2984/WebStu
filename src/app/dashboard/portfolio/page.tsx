/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
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
  const photos = useSyncExternalStore(subscribePhotos, getPhotos, getServerPhotos);

  // Bộ lọc hiển thị
  const [filterGroup, setFilterGroup] = useState<"ALL" | MainGroup>("ALL");

  // State cho Modal Thêm / Sửa ảnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [group, setGroup] = useState<MainGroup>("Concept");
  const [album, setAlbum] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Gom nhóm dữ liệu theo Group -> Album
  const groupedAlbums = useMemo(() => {
    const groups: MainGroup[] = ["Concept", "Ngoại cảnh"];
    return groups
      .filter((g) => filterGroup === "ALL" || filterGroup === g)
      .map((g) => {
        const groupPhotos = photos.filter((p) => p.group === g);
        const albumMap = new Map<string, PhotoItem[]>();
        groupPhotos.forEach((item) => {
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

  // Gợi ý tên album có sẵn theo nhóm đang chọn
  const existingAlbumsForGroup = useMemo(() => {
    return Array.from(
      new Set(photos.filter((p) => p.group === group).map((p) => p.album))
    );
  }, [photos, group]);

  // Mở form thêm mới (có thể truyền sẵn group & album)
  const openAddModal = (presetGroup: MainGroup = "Concept", presetAlbum = "") => {
    setEditId(null);
    setGroup(presetGroup);
    setAlbum(presetAlbum);
    setTitle("");
    setUrl("");
    setIsModalOpen(true);
  };

  // Mở form chỉnh sửa ảnh
  const openEditModal = (photo: PhotoItem) => {
    setEditId(photo.id);
    setGroup(photo.group);
    setAlbum(photo.album);
    setTitle(photo.title);
    setUrl(photo.url);
    setIsModalOpen(true);
  };

  // Xử lý chọn file từ máy tính & tự động tối ưu kích thước ảnh
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

  // Lưu ảnh (Thêm mới hoặc Cập nhật)
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!album.trim() || !title.trim() || !url.trim()) return;

    let updated: PhotoItem[];
    if (editId !== null) {
      updated = photos.map((p) =>
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

  // Xóa 1 ảnh
  const handleDeletePhoto = (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    savePhotos(photos.filter((p) => p.id !== id));
  };

  // Đổi tên cả Album
  const handleRenameAlbum = (targetGroup: MainGroup, oldName: string) => {
    const newName = prompt("Nhập tên mới cho Album:", oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const updated = photos.map((p) =>
      p.group === targetGroup && p.album === oldName
        ? { ...p, album: newName.trim() }
        : p
    );
    savePhotos(updated);
  };

  // Xóa cả Album
  const handleDeleteAlbum = (targetGroup: MainGroup, albumName: string) => {
    if (!confirm(`Xóa toàn bộ album "${albumName}" và tất cả ảnh bên trong?`)) return;
    const updated = photos.filter(
      (p) => !(p.group === targetGroup && p.album === albumName)
    );
    savePhotos(updated);
  };

  const handleResetDefault = () => {
    if (!confirm("Khôi phục lại dữ liệu mẫu ban đầu?")) return;
    savePhotos(DEFAULT_PHOTOS);
  };

  return (
    <div className="min-h-screen bg-gray-50/70 p-6 md:p-8 text-slate-800">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý Trang Portfolio (/customer)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sắp xếp Concept, Ngoại cảnh và các Album trưng bày cho khách hàng xem trước.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDefault}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
          >
            Khôi phục mẫu
          </button>

          <Link
            href="/customer"
            target="_blank"
            className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition"
          >
            Xem trang khách ↗
          </Link>

          <button
            onClick={() => openAddModal("Concept", "")}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-sm transition cursor-pointer"
          >
            + Thêm ảnh / Album mới
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="max-w-7xl mx-auto flex items-center gap-2 mb-6">
        {(["ALL", "Concept", "Ngoại cảnh"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterGroup(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              filterGroup === tab
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab === "ALL" ? `Tất cả (${photos.length} ảnh)` : tab}
          </button>
        ))}
      </div>

      {/* DANH SÁCH THEO NHÓM: CONCEPTS -> NGOẠI CẢNH */}
      <div className="max-w-7xl mx-auto space-y-10">
        {groupedAlbums.map(({ groupName, albums }) => (
          <section key={groupName} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-7 rounded-full bg-purple-600 inline-block" />
                <h2 className="text-xl font-bold text-slate-900">{groupName}</h2>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                  {albums.length} Album
                </span>
              </div>

              <button
                onClick={() => openAddModal(groupName, "")}
                className="text-sm font-medium text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                + Tạo Album {groupName}
              </button>
            </div>

            {albums.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500 text-sm">
                Chưa có album nào trong mục <strong>{groupName}</strong>.
              </div>
            ) : (
              <div className="space-y-6">
                {albums.map(({ albumName, items }) => (
                  <div
                    key={albumName}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs"
                  >
                    {/* Album Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {albumName}
                        </h3>
                        <p className="text-xs text-slate-500">{items.length} hình ảnh</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAddModal(groupName, albumName)}
                          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition cursor-pointer"
                        >
                          + Thêm ảnh vào album
                        </button>
                        <button
                          onClick={() => handleRenameAlbum(groupName, albumName)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                        >
                          Đổi tên album
                        </button>
                        <button
                          onClick={() => handleDeleteAlbum(groupName, albumName)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition cursor-pointer"
                        >
                          Xóa album
                        </button>
                      </div>
                    </div>

                    {/* Grid ảnh trong Album */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                      {items.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-2/3"
                        >
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(photo)}
                                className="px-2 py-1 text-[11px] font-medium bg-white text-slate-800 rounded-md hover:bg-purple-50 cursor-pointer"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="px-2 py-1 text-[11px] font-medium bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                              >
                                Xóa
                              </button>
                            </div>
                            <p className="text-xs font-medium text-white truncate">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editId !== null ? "Chỉnh sửa hình ảnh" : "Thêm ảnh mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân mục chính
                </label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as MainGroup)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-600"
                >
                  <option value="Concept">Concept</option>
                  <option value="Ngoại cảnh">Ngoại cảnh</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Album (Chọn có sẵn hoặc gõ tên album mới)
                </label>
                <input
                  type="text"
                  list="album-suggestions"
                  required
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="VD: Nàng Thơ Studio, Hoàng Hôn Đà Lạt..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-600"
                />
                <datalist id="album-suggestions">
                  {existingAlbumsForGroup.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên tác phẩm / Tiêu đề ảnh
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Muse I"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tải ảnh từ máy tính
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {isUploading && (
                  <p className="text-xs text-purple-600 mt-1">Đang xử lý ảnh...</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hoặc dán Link ảnh (URL)
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              {url && (
                <div className="rounded-xl overflow-hidden border border-slate-200 h-44 bg-slate-100">
                  <img
                    src={url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
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
