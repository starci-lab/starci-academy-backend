# Feature — CourseCatalog
> Danh sách khóa học nổi bật (search + phân trang + grid⇆line). Nguồn: `features/course/CourseCatalog`.

- **Job**: duyệt N khóa học đã curate (không phải toàn bộ catalog thô) để chọn 1 khóa xem tiếp → shell [[catalog-grid]].
- **CTA**: không có CTA "mua" ở đây — mỗi `CatalogCourseCard` chỉ dẫn SANG `CourseDetail` (nơi mới có buy-box thật). Đây là tầng DUYỆT, không phải tầng CHỐT. → [[call-to-action]]
- **Links (onward)**: click card → `CourseDetail`; search debounce 350ms + pager (luôn render, không ẩn ở ≤1 trang); toggle grid⇆line persist `localStorage`. → [[content-linking]]
- **Psychology**: `COURSE_ORDER` = thứ tự lộ trình curated (Fullstack→...→Claude) đè lên sort ES mặc định — một dạng "default ordering as choice architecture" (khóa được đề xuất đứng trước, không phải random/alphabet). Không có scarcity/social-proof ở tầng này (đúng — đó là việc của CourseDetail). → [[persuasion-psychology]]
- **Ghi chú**: ví dụ tốt cho "1 job = 1 shell nhẹ" — catalog không cố bán, chỉ giúp tìm nhanh (search+count+grid/line), giữ đúng vai của [[layouts/catalog-grid]] tách khỏi vai bán hàng của CourseDetail.
