"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Download, UserX, Loader2 } from "lucide-react";
import {
  anonymizeClientDataAction,
  exportClientPersonalDataAction,
} from "@/features/clients/privacy-actions";

interface MinimalClient {
  id: string;
  name: string;
  phone: string | null;
}

export function ClientPrivacyPanel({ clients }: { clients: MinimalClient[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    if (!selectedId) return;
    setStatusMsg(null);
    startTransition(async () => {
      try {
        const data = await exportClientPersonalDataAction(selectedId);
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json;charset=utf-8",
        });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `ho-so-du-lieu-khach-${selectedId.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(downloadUrl);
        setStatusMsg("Đã xuất bản sao dữ liệu cá nhân (JSON) theo Điều 14 Nghị định 13.");
      } catch (err) {
        setStatusMsg(err instanceof Error ? err.message : "Lỗi xuất dữ liệu.");
      }
    });
  };

  const handleAnonymize = () => {
    if (!selectedId) return;
    const target = clients.find((c) => c.id === selectedId);
    const confirmed = confirm(
      `Xác nhận ẩn danh hóa vĩnh viễn thông tin cá nhân (Họ tên, SĐT, Link MXH) của "${target?.name}" theo yêu cầu xóa dữ liệu Nghị định 13/2023/NĐ-CP?\n\nLưu ý: Lịch sử doanh thu và mã lịch hẹn cũ vẫn được giữ nguyên để không sai lệch sổ sách.`
    );
    if (!confirmed) return;

    setStatusMsg(null);
    startTransition(async () => {
      try {
        await anonymizeClientDataAction(selectedId);
        setSelectedId("");
        setStatusMsg("Đã ẩn danh hóa dữ liệu định danh khách hàng thành công.");
        router.refresh();
      } catch (err) {
        setStatusMsg(err instanceof Error ? err.message : "Lỗi ẩn danh dữ liệu.");
      }
    });
  };

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              Tuân thủ Nghị định 13/2023/NĐ-CP (Quyền chủ thể dữ liệu)
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Xuất bản sao hồ sơ dữ liệu cá nhân hoặc ẩn danh hóa thông tin định danh khi khách hàng yêu cầu xóa dữ liệu.
            </p>
          </div>
        </div>

        <Link
          href="/privacy"
          target="_blank"
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          Xem Chính sách bảo mật ↗
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-10 flex-1 rounded-xl border bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">-- Chọn khách hàng cần trích xuất hoặc ẩn danh --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.phone || "Chưa có SĐT"})
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!selectedId || isPending}
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-background px-4 text-xs font-medium hover:bg-accent disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Xuất dữ liệu (JSON)
          </button>

          <button
            type="button"
            disabled={!selectedId || isPending}
            onClick={handleAnonymize}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-destructive/10 px-4 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 cursor-pointer"
          >
            <UserX className="h-3.5 w-3.5" />
            Ẩn danh / Xóa PII
          </button>
        </div>
      </div>

      {statusMsg && (
        <p className="text-xs font-medium text-primary">{statusMsg}</p>
      )}
    </div>
  );
}