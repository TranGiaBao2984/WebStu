import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Chính sách Bảo vệ Dữ liệu Cá nhân | Ni Studio",
  description: "Thông báo xử lý dữ liệu cá nhân tuân thủ Nghị định 13/2023/NĐ-CP.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/customer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang Portfolio
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Chính sách Bảo vệ Dữ liệu Cá nhân
              </h1>
              <p className="text-xs text-muted-foreground">
                Tuân thủ Nghị định số 13/2023/NĐ-CP của Chính phủ Việt Nam
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 sm:p-8 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold">1. Phân loại dữ liệu cá nhân thu thập</h2>
            <p className="text-muted-foreground">
              Studio chỉ thu thập <strong>Dữ liệu cá nhân cơ bản</strong> ở mức tối thiểu phục vụ dịch vụ nhiếp ảnh, bao gồm: Họ tên, số điện thoại liên hệ, đường dẫn mạng xã hội (Facebook/Zalo/Instagram) do khách hàng chủ động cung cấp và hình ảnh buổi chụp. Studio không thu thập dữ liệu cá nhân nhạy cảm trái quy định pháp luật.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">2. Mục đích xử lý dữ liệu</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Xác nhận lịch hẹn, điều phối ca chụp và bàn giao album ảnh gốc/retouch.</li>
              <li>Xuất phiếu xác nhận dịch vụ, theo dõi thanh toán và chăm sóc khách hàng.</li>
              <li>Hình ảnh chỉ được đăng tải công khai trên trang Portfolio khi có sự đồng ý rõ ràng từ khách hàng.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">3. Lưu trữ & Biện pháp bảo vệ</h2>
            <p className="text-muted-foreground">
              Dữ liệu được mã hóa đường truyền (HTTPS/TLS), lưu trữ trên hạ tầng cơ sở dữ liệu phân quyền chặt chẽ (Row-Level Security) và chỉ nhân sự được ủy quyền của Studio mới có quyền truy cập.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">4. Quyền của Chủ thể dữ liệu (Điều 9, 14, 16 NĐ 13)</h2>
            <p className="text-muted-foreground">
              Khách hàng có quyền yêu cầu Studio: (a) Cung cấp bản sao toàn bộ dữ liệu cá nhân đang lưu trữ; (b) Chỉnh sửa thông tin sai lệch; hoặc (c) Rút lại sự đồng ý, gỡ bỏ ảnh khỏi Portfolio và ẩn danh hóa/xóa thông tin định danh khỏi hệ thống CRM bất cứ lúc nào bằng cách liên hệ trực tiếp với Studio.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}