"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Images,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import {
  createAlbumAction,
  updateAlbumStatusAction,
  regenerateAlbumTokenAction,
  deleteAlbumAction,
} from "@/features/albums/actions";
import type { AlbumWithBooking, AlbumStatusValue } from "@/features/albums/queries";
import type { BookingListItem } from "@/features/bookings/queries";
import { formatDateVN } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ALBUM_STATUS_LABELS: Record<AlbumStatusValue, string> = {
  draft: "Bản nháp",
  awaiting_client: "Chờ khách chọn",
  client_selecting: "Khách đang chọn",
  client_done: "Khách đã chốt ảnh",
  retouching: "Đang retouch",
  ready: "Đã xong ảnh chỉnh",
  delivered: "Đã bàn giao",
};

const ALBUM_STATUS_OPTIONS: AlbumStatusValue[] = [
  "draft",
  "awaiting_client",
  "client_selecting",
  "client_done",
  "retouching",
  "ready",
  "delivered",
];

export function AlbumsClient({
  albums,
  bookings,
}: {
  albums: AlbumWithBooking[];
  bookings: BookingListItem[];
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // State tạo album
  const [bookingId, setBookingId] = useState("");
  const [title, setTitle] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [maxSelectable, setMaxSelectable] = useState("20");
  const [dueDate, setDueDate] = useState("");

  const handleBookingPick = (bId: string) => {
    setBookingId(bId);
    const found = bookings.find((b) => b.id === bId);
    if (found && !title) {
      setTitle(`${found.title} - ${found.clientName}`);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setNotice(null);
      const res = await createAlbumAction({
        booking_id: bookingId || undefined,
        title,
        source_ref: sourceRef,
        max_selectable: maxSelectable ? Number(maxSelectable) : null,
        due_date: dueDate || undefined,
      });

      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else {
        setBookingId("");
        setTitle("");
        setSourceRef("");
        setDueDate("");
        setNotice({ type: "ok", text: "Đã tạo Album và sinh link chọn ảnh cho khách." });
        router.refresh();
      }
    });
  };

  const copyShareLink = async (album: AlbumWithBooking) => {
    if (!album.share_token) return;
    const url = `${window.location.origin}/album/${album.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(album.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copySelectedCodes = async (codes: string[]) => {
    await navigator.clipboard.writeText(codes.join(", "));
    setNotice({ type: "ok", text: `Đã sao chép ${codes.length} mã ảnh vào bộ nhớ tạm.` });
  };

  return (
    <div className="space-y-6">
      {/* Form tạo album mới */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tạo Album gửi khách chọn ảnh</CardTitle>
          <CardDescription>
            Dán link thư mục Google Drive chứa ảnh gốc để hệ thống tạo đường dẫn riêng cho khách nhập mã ảnh cần retouch (không cần đăng nhập).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Gắn với lịch hẹn (tùy chọn)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={bookingId}
                  onChange={(e) => handleBookingPick(e.target.value)}
                >
                  <option value="">-- Không gắn lịch hẹn --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortCode} • {b.title} ({b.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Tên Album hiển thị cho khách *</Label>
                <Input
                  placeholder="VD: Album Ảnh Cưới - Minh Anh"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Link Google Drive / Kho ảnh gốc *</Label>
                <Input
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={sourceRef}
                  onChange={(e) => setSourceRef(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Số ảnh tối đa được chọn</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Không giới hạn"
                    value={maxSelectable}
                    onChange={(e) => setMaxSelectable(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hạn chọn ảnh</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isPending}>
              <Plus className="mr-1.5 h-4 w-4" />
              Tạo Album & Lấy link chia sẻ
            </Button>
          </form>
        </CardContent>
      </Card>

      {notice && (
        <div
          className={
            notice.type === "ok"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          }
        >
          {notice.text}
        </div>
      )}

      {/* Danh sách Album */}
      {albums.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Chưa có album nào. Hãy tạo album đầu tiên ở khung phía trên.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {albums.map((album) => (
            <Card key={album.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Images className="h-4 w-4 text-primary" />
                      <span className="text-base font-bold">{album.title}</span>
                      {album.bookingShortCode && (
                        <Badge variant="outline">{album.bookingShortCode}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {album.clientName ? `Khách: ${album.clientName} • ` : ""}
                      Giới hạn:{" "}
                      <span className="font-medium text-foreground">
                        {album.max_selectable ? `${album.max_selectable} ảnh` : "Không giới hạn"}
                      </span>
                      {album.due_date ? ` • Hạn chọn: ${formatDateVN(album.due_date)}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="flex h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
                      value={album.status}
                      disabled={isPending}
                      onChange={(e) =>
                        startTransition(async () => {
                          await updateAlbumStatusAction(
                            album.id,
                            e.target.value as AlbumStatusValue
                          );
                          router.refresh();
                        })
                      }
                    >
                      {ALBUM_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {ALBUM_STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>

                    <a
                      href={album.source_ref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium hover:bg-accent"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Drive gốc
                    </a>

                    {album.share_token && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => copyShareLink(album)}
                        >
                          {copiedId === album.id ? (
                            <>
                              <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                              Đã chép link
                            </>
                          ) : (
                            <>
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              Copy link khách
                            </>
                          )}
                        </Button>

                        <a
                          href={`/album/${album.share_token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Mở thử trang khách chọn ảnh"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </>
                    )}

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          if (
                            !window.confirm(
                              "Tạo lại link mới sẽ làm vô hiệu hóa link cũ đã gửi cho khách. Tiếp tục?"
                            )
                          )
                            return;
                          await regenerateAlbumTokenAction(album.id);
                          router.refresh();
                        })
                      }
                      title="Cấp lại link chia sẻ mới"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          if (!window.confirm(`Xóa album "${album.title}"?`)) return;
                          await deleteAlbumAction(album.id);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Danh sách mã ảnh khách đã gửi */}
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Ảnh khách đã chọn ({album.selectedList.length}
                      {album.max_selectable ? ` / ${album.max_selectable}` : ""})
                    </span>
                    {album.selectedList.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => copySelectedCodes(album.selectedList)}
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Chép danh sách mã ảnh
                      </Button>
                    )}
                  </div>

                  {album.selectedList.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Khách chưa gửi danh sách mã ảnh nào.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {album.selectedList.map((code) => (
                        <Badge key={code} variant="secondary" className="font-mono text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {album.client_note && (
                    <p className="mt-2.5 border-t pt-2 text-xs text-foreground">
                      <span className="font-semibold">Ghi chú của khách:</span> {album.client_note}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}