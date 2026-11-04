# Ghi nhận việc sử dụng AI

## Prompt tạo mã nguồn
Dựa trên phương án đã thống nhất, hãy tạo một trang giao diện
thương mại điện tử bằng HTML5 và CSS3.

Yêu cầu:
- Giao diện có tiêu đề và khu vực sản phẩm.
- Có tối thiểu 4 sản phẩm mẫu.
- Mỗi sản phẩm có hình ảnh, tên, giá và nút thao tác.
- Bố cục phù hợp với màn hình máy tính và điện thoại.
- Mã HTML có cấu trúc rõ ràng.
- CSS được tách thành file riêng.
- Không sử dụng backend hoặc cơ sở dữ liệu.
- Không đưa thư viện hoặc thành phần không cần thiết vào dự án.

Giải thích cách chạy trang web và những phần tôi cần kiểm tra.

## Kết quả mã nguồn
- Ban đầu trang có 4 thẻ sản phẩm; hiện đã mở rộng thành 12 thẻ.
- CSS được tách riêng trong `style.css`.
- Mỗi thẻ có hình minh họa, tên, giá bán, giá gốc, tỷ lệ giảm giá và nút thao tác.
- Bố cục tự điều chỉnh theo màn hình máy tính, máy tính bảng và điện thoại.
- Nút thao tác chỉ hiện thông báo minh họa, không kết nối backend.
- Tên và giá là dữ liệu mẫu; tỷ lệ giảm giá được làm tròn, không phải giá bán thực tế đã xác minh.

## Quá trình sử dụng AI cho Buổi 2

Các nội dung dưới đây tóm tắt yêu cầu và kết quả trao đổi, không phải bản chép nguyên văn toàn bộ prompt.

1. **Mở rộng danh sách sản phẩm:** Yêu cầu AI kiểm tra mã nguồn, giữ 4 sản phẩm cũ và thêm 8 sản phẩm mẫu theo cấu trúc hiện có. AI chỉnh `index.html` và `style.css`, bổ sung SVG nội tuyến và dùng Flexbox để hỗ trợ căn chỉnh nội dung thẻ. AI kiểm tra bằng chương trình số lượng thẻ, tên, nhãn SVG, nút và tỷ lệ giảm giá; chưa kiểm thử giao diện bằng trình duyệt. Người học sau đó cho biết đã kiểm tra và hài lòng.
2. **Rà soát HTML và CSS:** Yêu cầu AI phân tích cấu trúc trang, selector, box model, Flexbox, Grid, media query và các điểm có thể cải thiện. AI phân biệt nhận xét dựa trên mã nguồn với các điểm cần kiểm tra trong trình duyệt; bước rà soát không sửa tệp.
3. **Củng cố HTML5:** Yêu cầu AI thêm `aria-label` riêng cho 12 nút “Xem sản phẩm”, gồm cụm chữ trên nút và tên sản phẩm tương ứng. AI chỉ sửa `index.html` và kiểm tra lại 12 nhãn theo mã nguồn; chức năng thông báo minh họa được giữ nguyên.
4. **Tạo và liên kết CSS:** Yêu cầu AI kiểm tra đường dẫn `style.css`, phông chữ, màu sắc, `body` và kích thước SVG; AI giải thích và hướng dẫn kiểm tra bằng Chrome DevTools, không sửa tệp.
5. **Selector và Box Model:** Yêu cầu AI giải thích `h1`, `.product-info`, `.product-info h2`, box model và `gap`; AI đổi padding cơ bản của `.product-info` từ `16px` sang `18px`. Padding trong media query điện thoại vẫn là `12px`.
6. **Thực hành Flexbox và Grid:** AI hướng dẫn thử `justify-content`, `align-items` và `gap` trên dòng giá; giải thích bố cục Grid, SVG và cách thử ba cột trong DevTools. Đây là hướng dẫn thực hành, không phải thay đổi được AI lưu vào mã nguồn. Người học cho biết đã thử ba cột ở 1366px và chụp bố cục hai cột ở 390px.
7. **Hover và focus:** AI giải thích các trạng thái của nút và đổi transition để `background-color` và `border-color` cùng chuyển trong `160ms ease`. Việc kiểm tra trực quan trên Chrome được để người học thực hiện.
8. **Khả năng đọc giá gốc:** Người học quan sát thấy giá gốc khó đọc ở 390px. AI phân tích màu `#8a8e92`, gợi ý `#595f65` và hướng dẫn người học tự thử. Tệp hiện tại có màu `#595f65`; cần tự ghi nhận kết quả kiểm tra và ảnh trước/sau, không suy diễn từ mã nguồn.
9. **Đưa mã lên GitHub:** AI chuẩn bị commit `2e22b93` cho `index.html` và `style.css` trong một bản sao tạm. Sau khi người học tự xác thực và chạy lại lệnh push, Terminal báo đã cập nhật nhánh `main`. Bản ghi `AI_USAGE.md` này được cập nhật sau commit đó.

## Giới hạn kiểm tra

- AI đã kiểm tra mã nguồn và một số điều kiện bằng chương trình; AI không xác nhận đã kiểm thử giao diện thực tế trong Chrome.
- Kết quả quan sát, thử nghiệm và ảnh minh chứng do người học tự thực hiện cần được ghi nhận theo thực tế.
- Thư mục dự án đang mở ban đầu không có `.git`; commit nói trên được tạo trong bản sao tạm, không tự thiết lập Git cho workspace này.

## Checklist kiểm tra và tự điều chỉnh
- [ ] Mở trang bằng trình duyệt.
- [ ] Chụp ảnh giao diện ở kích thước máy tính.
- [ ] Chuyển sang chế độ điện thoại và kiểm tra bố cục.
- [ ] Kiểm tra hình minh họa, tên, giá, tỷ lệ giảm giá và nút.
- [ ] Tự chỉnh sửa ít nhất một điểm trong HTML/CSS.
- [ ] Chạy lại trang, so sánh trước/sau và chụp ảnh minh chứng.

## Ghi nhận chỉnh sửa do bản thân thực hiện
Vấn đề phát hiện: .................................................
File và thuộc tính đã sửa: ........................................
Kết quả sau chỉnh sửa: ............................................

Lưu ý: Điền phần trên sau khi tự quan sát và chỉnh sửa trên máy; không ghi kết quả chưa kiểm tra thực tế.
