# Khén Nọc

Ứng dụng cá nhân quản lý công việc. Phần Todo được tích hợp từ mã mẫu do bạn học cung cấp và điều chỉnh giao diện, lưu trữ và thống kê cho bài nộp của Nguyễn Thị Khánh Ngọc (31241024603).

## Chạy ứng dụng

Mở Terminal tại thư mục chứa `package.json`. Dùng Node.js 22.13 trở lên, bản này đã được kiểm thử với Node.js 24.

```bash
npm start
```

Mở [http://localhost:8080](http://localhost:8080). Backend tự tạo `data/todo.sqlite` và thêm bốn công việc mẫu trong ngày khi khởi động lần đầu. Dự án dùng các module có sẵn của Node.js.

Nếu đã bật server của bài `Bai2.js`, dừng bằng **Ctrl+C** trước khi chạy Todo. Trên macOS và Linux, có thể dùng `PORT=8081 npm start` để chạy Todo ở cổng khác.

## Chức năng

- Thêm công việc, sửa tên, mô tả, danh mục, ngày, giờ và mức ưu tiên. Khi xóa, hệ thống yêu cầu xác nhận.
- Chọn trạng thái **Cần làm**, **Đang làm** hoặc **Hoàn thành** trong biểu mẫu. Nút dấu ✓ chuyển nhanh giữa trạng thái chưa hoàn thành và hoàn thành.
- Tìm kiếm, lọc và tạo danh mục.
- Mục **Thống kê** hiển thị tổng số công việc đến hạn trong ngày, số đã hoàn thành, số đang làm và số chưa hoàn thành có ưu tiên cao. Biểu đồ tuần đếm công việc đang ở trạng thái hoàn thành theo ngày hoàn thành, từ thứ Hai đến Chủ nhật.

## Tệp trong bài nộp

| Tệp hoặc thư mục | Nội dung |
| --- | --- |
| `Bai1.html`, `Bai2.js` | Hai bài đầu về animation và HTTP server. Chạy riêng bài 2 bằng `node Bai2.js`. |
| `NguyenThiKhanhNgoc.docx` | Báo cáo gồm minh chứng hai bài đầu và phần Todo được bổ sung. |
| `public/` | Giao diện, CSS và JavaScript phía trình duyệt. |
| `server.js`, `database/store.js` | HTTP server, REST API và lớp lưu dữ liệu SQLite. |
| `database/schema.sql` | Lược đồ, khóa ngoại, chỉ mục và trigger. |

## API và lưu trữ

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/api/health` | Xem tình trạng server và loại lưu trữ. |
| GET | `/api/tasks` | Lấy danh sách công việc. Thêm `?date=YYYY-MM-DD` để lọc theo hạn. |
| POST | `/api/tasks` | Tạo công việc mới. |
| PATCH | `/api/tasks/:id` | Cập nhật thông tin hoặc trạng thái. |
| DELETE | `/api/tasks/:id` | Xóa công việc khỏi danh sách. |
| GET, POST | `/api/categories` | Xem hoặc thêm danh mục. |

Xem [hướng dẫn cơ sở dữ liệu](database/README.md) để đối chiếu lược đồ và chạy truy vấn kiểm tra. Khi triển khai riêng thư mục `public` lên GitHub Pages, giao diện chuyển sang dùng `localStorage` trên trình duyệt.
