# Feature — Jobs (careers)
> Job board 2 chiều — người tìm việc duyệt, công ty đăng tin. Nguồn: `features/careers/Jobs` (`JobList` · `JobDetail` · `JobPostForm`).

- **Job**: `JobList` = duyệt N tin tuyển dụng đã lọc (search + work-mode + employment-type) → shell [[catalog-grid]] (đúng tên trong bảng archetype); `JobDetail` = đọc 1 tin + ứng tuyển, 1 cột đọc.
- **CTA**: header luôn có secondary "Đăng tuyển" (mở `JobPostForm`); mỗi tin ở `JobDetail` có ĐÚNG 1 primary "Ứng tuyển" theo `applyMethod` (mở `applyUrl` tab mới hoặc `mailto:`) — không CTA giả, luồng ứng tuyển thật. → [[call-to-action]]
- **Links (onward)**: `JobListRow` → `JobDetail`; tên công ty trong `JobDetail` cố deep-link sang trang company theo course đang active (best-effort, không có route company toàn cục — hạn chế đã ghi rõ trong code). → [[content-linking]]
- **Psychology**: 2 empty-state TÁCH BẠCH theo lý do — lọc-ra-0-kết-quả → "Xoá bộ lọc"; board THẬT SỰ trống → phễu 2 chiều "chưa có tin — công ty bạn đang tuyển? đăng miễn phí" (không giả vờ có tin để đỡ trống); count "tìm thấy N" luôn là số thật cạnh search (minh bạch, không phải scarcity giả). → [[persuasion-psychology]]
- **Ghi chú**: ví dụ tốt ngoài phạm vi khóa học cho pattern "rỗng = phễu, không ngõ cụt" ([[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] họ) — ở đây phễu 2 chiều (ứng viên ↔ nhà tuyển dụng) thay vì chỉ phễu về khóa.
