# Cơ sở dữ liệu

`schema.sql` là lược đồ SQLite mà server nạp khi khởi động. Bản Todo hiện dùng một workspace cá nhân và tự tạo `data/todo.sqlite`. Các thao tác công việc và danh mục đi qua `database/store.js`, sử dụng câu lệnh SQL có tham số.

## Quan hệ chính

```text
users ──< workspaces ──< categories
  │             ├─────< tasks ──< task_comments
  │             │          ├────< task_reminders
  └── workspace_members     ├────< task_events
                             ├────  recurrence_rules (0..1)
labels >── task_labels ──────┘
```

- Mỗi task thuộc workspace; danh mục cũng thuộc workspace. Khóa ngoại kép ngăn task tham chiếu danh mục của workspace khác.
- `task_labels` biểu diễn quan hệ nhiều-nhiều giữa task và nhãn.
- `task_events` giữ lịch sử thay đổi; `deleted_at` hỗ trợ xóa mềm để bảo toàn dữ liệu.
- Ràng buộc `CHECK`, unique và foreign key kiểm tra dữ liệu ngay trong database.
- Partial index ưu tiên các task chưa bị xóa; FTS5 lập chỉ mục tiêu đề và mô tả để tìm kiếm toàn văn.

## Truy vấn thường dùng

Danh sách checklist trong ngày:

```sql
SELECT id, title, description, status, priority, due_time, category_id
FROM tasks
WHERE workspace_id = :workspace_id
  AND due_date = :date
  AND deleted_at IS NULL
ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
         due_time IS NULL, due_time;
```

Tìm toàn văn, hỗ trợ tiền tố từ khóa bằng FTS5:

```sql
SELECT t.id, t.title, t.status, rank
FROM tasks_fts
JOIN tasks AS t ON t.rowid = tasks_fts.rowid
WHERE tasks_fts MATCH :fts_query
  AND t.workspace_id = :workspace_id
  AND t.deleted_at IS NULL
ORDER BY rank
LIMIT 20;
```

Ví dụ `:fts_query` là `"node"* OR "html"*`. Hãy tạo biểu thức FTS từ token đã escape, không nối trực tiếp input thô vào SQL.

Thống kê trạng thái trong ngày:

```sql
SELECT status, COUNT(*) AS task_count
FROM tasks
WHERE workspace_id = :workspace_id
  AND due_date = :date
  AND deleted_at IS NULL
GROUP BY status;
```

## Khởi tạo và kiểm tra

Server bật khóa ngoại và chế độ WAL khi mở cơ sở dữ liệu. Lần chạy đầu tạo workspace, các danh mục mặc định và dữ liệu mẫu trong một giao dịch. Nếu thư mục `data` đã có `tasks.json` từ phiên bản cũ, dữ liệu trong file đó được nhập vào SQLite một lần trong lúc khởi tạo.

Chạy `npm start` và mở [http://localhost:8080/api/health](http://localhost:8080/api/health) để xem phản hồi `{"ok":true,"storage":"sqlite"}`. Có thể mở `data/todo.sqlite` bằng công cụ đọc SQLite để đối chiếu các bảng và số liệu.
