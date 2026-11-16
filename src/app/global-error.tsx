"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Production Error Boundary]:", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-900 p-6">
        <div className="max-w-md w-full rounded-2xl border bg-white p-6 shadow-sm space-y-4 text-center">
          <h2 className="text-lg font-bold">Hệ thống gặp gián đoạn tạm thời</h2>
          <p className="text-sm text-neutral-600">
            Sự cố đã được ghi nhận tự động. Vui lòng thử tải lại trang hoặc quay lại sau ít phút.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-neutral-400">
              Mã sự cố: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 cursor-pointer"
          >
            Tải lại trang
          </button>
        </div>
      </body>
    </html>
  );
}