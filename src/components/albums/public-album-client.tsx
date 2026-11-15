"use client";

import { useState, useTransition } from "react";
import {
  Camera,
  ExternalLink,
  Plus,
  X,
  Send,
  Save,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { submitPublicSelectionAction } from "@/features/albums/actions";
import type { PublicAlbumData } from "@/features/albums/queries";
import { formatDateVN } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function parseSelectedFiles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}

export function PublicAlbumClient({
  token,
  album,
}: {
  token: string;
  album: PublicAlbumData;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    parseSelectedFiles(album.selected_files)
  );
  const [singleInput, setSingleInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [clientNote, setClientNote] = useState(album.client_note ?? "");
  const [status, setStatus] = useState(album.status);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isLocked = status !== "awaiting_client" && status !== "client_selecting";
  const maxAllowed = album.max_selectable;

  const addCodes = (rawText: string) => {
    const tokens = rawText
      .split(/[\s,;|\n\r]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    const merged = Array.from(new Set([...selected, ...tokens]));
    if (maxAllowed && merged.length > maxAllowed) {
      setNotice({
        type: "err",
        text: `Gói của bạn chỉ chọn tối đa ${maxAllowed} ảnh (bạn đang chọn ${merged.length} ảnh).`,
      });
      return;
    }

    setNotice(null);
    setSelected(merged);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    addCodes(singleInput);
    setSingleInput("");
  };

  const handleAddBulk = () => {
    addCodes(bulkInput);
    setBulkInput("");
  };

  const removeCode = (code: string) => {
    if (isLocked) return;
    setSelected((prev) => prev.filter((item) => item !== code));
  };

  const handleSaveOrSubmit = (finalize: boolean) => {
    if (finalize && selected.length === 0) {
      setNotice({ type: "err", text: "Vui lòng nhập ít nhất 1 mã ảnh trước khi gửi chốt." });
      return;
    }

    if (
      finalize &&
      !window.confirm(
        `Xác nhận chốt danh sách ${selected.length} ảnh đã chọn? Sau khi chốt bạn sẽ không thể tự chỉnh sửa thêm.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      setNotice(null);
      const res = await submitPublicSelectionAction({
        token,
        selectedFiles: selected,
        clientNote,
        finalize,
      });

      if (res.error) {
        setNotice({ type: "err", text: res.error });
      } else if (finalize) {
        setStatus("client_done");
        setNotice({
          type: "ok",
          text: "Đã gửi danh sách ảnh thành công! Studio sẽ tiến hành retouch theo lựa chọn của bạn.",
        });
      } else {
        setStatus("client_selecting");
        setNotice({
          type: "ok",
          text: "Đã lưu nháp danh sách ảnh của bạn. Bạn có thể quay lại chọn tiếp bất cứ lúc nào.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-background p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold">{album.studio_name}</p>
              {album.studio_phone && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {album.studio_phone}
                </p>
              )}
            </div>
          </div>
          <Badge variant={isLocked ? "secondary" : "default"}>
            {isLocked ? "Đã chốt danh sách" : "Đang mở chọn ảnh"}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{album.title}</CardTitle>
            <CardDescription>
              {album.client_name ? `Khách hàng: ${album.client_name} • ` : ""}
              {album.due_date ? `Hạn gửi chọn ảnh: ${formatDateVN(album.due_date)}` : "Chọn ảnh retouch"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-semibold text-foreground">Bước 1: Mở thư mục xem ảnh gốc</p>
                <p className="text-xs text-muted-foreground">
                  Xem tên/mã số dưới mỗi bức ảnh trên Google Drive rồi nhập vào bên dưới.
                </p>
              </div>
              <a
                href={album.source_ref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                Mở Google Drive
              </a>
            </div>

            {notice && (
              <div
                className={
                  notice.type === "ok"
                    ? "flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                }
              >
                {notice.type === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{notice.text}</span>
              </div>
            )}

            {!isLocked && (
              <div className="space-y-4 border-t pt-4">
                <form onSubmit={handleAddSingle} className="space-y-1.5">
                  <Label>Bước 2: Nhập từng mã ảnh (VD: IMG_1024 hoặc 1024)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã ảnh rồi bấm Thêm..."
                      value={singleInput}
                      onChange={(e) => setSingleInput(e.target.value)}
                    />
                    <Button type="submit" variant="secondary">
                      <Plus className="mr-1 h-4 w-4" />
                      Thêm
                    </Button>
                  </div>
                </form>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Hoặc dán nhiều mã ảnh cùng lúc (cách nhau bằng dấu phẩy, dấu cách hoặc xuống dòng)
                  </Label>
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      placeholder="VD: IMG_012, IMG_045, IMG_089..."
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={handleAddBulk}>
                      Thêm loạt
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label>
                  Danh sách ảnh đã chọn ({selected.length}
                  {maxAllowed ? ` / ${maxAllowed}` : ""})
                </Label>
                {maxAllowed && (
                  <span className="text-xs text-muted-foreground">
                    Còn được chọn thêm: {Math.max(0, maxAllowed - selected.length)} ảnh
                  </span>
                )}
              </div>

              {selected.length === 0 ? (
                <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Chưa có mã ảnh nào được thêm.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3">
                  {selected.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-medium shadow-2xs"
                    >
                      {code}
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => removeCode(code)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Bỏ chọn ${code}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú chỉnh sửa cho Studio (tùy chọn)</Label>
              <Textarea
                rows={3}
                disabled={isLocked}
                placeholder="VD: Làm mịn da tự nhiên, bóp gọn tay ở tấm IMG_045..."
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
              />
            </div>

            {!isLocked && (
              <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleSaveOrSubmit(false)}
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Lưu nháp
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSaveOrSubmit(true)}
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  Gửi & Chốt danh sách ảnh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}