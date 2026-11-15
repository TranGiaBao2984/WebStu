# Các giả định kỹ thuật (MVP 1 người dùng)

1. **Tự động khởi tạo studio_settings**: Khi tạo tài khoản chủ studio trong auth.users, trigger tự chèn 1 dòng mặc định vào studio_settings (timezone = 'Asia/Ho_Chi_Minh').
2. **Khóa đăng ký người dùng mới**: Tắt đăng ký mới trên Supabase Authentication và chặn route /signup ở middleware ứng dụng.
3. **Lưu lựa chọn ảnh trên albums**: Bổ sung cột selected_files (jsonb) và client_note (text) trên bảng albums để dùng cho Phase D.
4. **Tiền tệ & Làm tròn**: Mọi số tiền lưu bigint đơn vị VND. Tỷ lệ phần trăm đã trả tính bằng Math.round((paid * 100) / total_price).
