# MvcMovie

MvcMovie là website cửa hàng phim phục vụ bài thực hành môn Phát triển ứng dụng TMĐT. Ứng dụng dùng C#, ASP.NET Core MVC, Razor, Bootstrap, ASP.NET Core Identity, Entity Framework Core và SQL Server. Website được triển khai trên Somee.

- Quản lý phim và thể loại, kiểm tra dữ liệu nhập và lưu ảnh phim.
- Hiển thị danh sách phim và quản lý giỏ hàng bằng Session.
- Tiếp nhận thông tin giao hàng, lưu hóa đơn và gửi email xác nhận khi môi trường có cấu hình SMTP.
- [Website trên Somee](http://uehptudw31241024603.somee.com)

## Cấu trúc

```text
ASP-CORE/
  README.md
  SourceCode/
    Controllers/
    Data/
    Models/
    Migrations/
    Views/
    wwwroot/
    appsettings.example.json
  Report/
    BaiTap_CaNhan_ASP_CORE_LMS.docx
    images/
```

## Cấu hình và chạy trên máy cá nhân

Cài .NET SDK 10 và chuẩn bị một cơ sở dữ liệu SQL Server mà bạn được phép sử dụng. Chạy các lệnh từ thư mục `ASP-CORE` trong bản sao repository.

```bash
cd SourceCode
cp -n appsettings.example.json appsettings.json
dotnet restore
```

Thiết lập khóa `ConnectionStrings:DefaultConnection` bằng ASP.NET Core User Secrets trong môi trường Development. Nếu dự án chưa có `UserSecretsId`, chạy `dotnet user-secrets init` trước. Ví dụ dưới đây dùng giá trị giữ chỗ. Dùng thông tin đăng nhập của cơ sở dữ liệu do bạn quản lý trên máy của mình.

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=YOUR_SQL_HOST;Database=YOUR_DB;User ID=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=True;"
```

Nếu cần thử gửi email, đặt `Email:Address` và `Email:AppPassword` bằng User Secrets. Trên hosting, thiết lập các khóa qua cấu hình riêng của môi trường chạy. Tham khảo [Microsoft Learn về User Secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets).

Khôi phục công cụ Entity Framework Core nếu chưa cài và cập nhật cơ sở dữ liệu **phát triển** mà bạn quản lý.

```bash
dotnet tool install --global dotnet-ef --version '10.0.*'
dotnet ef database update
dotnet run
```

Nếu đã có `dotnet-ef` 10.x, tiếp tục từ lệnh `dotnet ef database update`. Mở URL `Now listening on` do Terminal hiển thị. Tạo thể loại ở `/Genres` trước khi tạo phim ở `/Movies/Create`.
