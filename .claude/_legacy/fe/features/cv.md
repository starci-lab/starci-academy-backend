# Feature — CV
> Bộ sưu tập CV cá nhân (gallery) → mở 1 CV trong editor riêng. Nguồn: `features/profile/CV`.

- **Job**: (1) quản lý N CV đã tạo → shell [[catalog-grid]] (`CvGallery`, thumbnail sống); (2) soạn/sửa 1 CV → deep-link vào shell [[full-bleed-work-surface]] (`CvEditor`, route riêng `/profile/cv/[id]`), tách khỏi chrome profile chật.
- **CTA**: mỗi card gallery = hover-reveal pill "Mở trình chỉnh sửa" (progressive disclosure, không nút lộ sẵn gây rối ảnh thumbnail); "+ Tạo CV" tạo xong auto-mở editor luôn (không dừng ở màn trung gian). → [[call-to-action]]
- **Links (onward)**: card → editor route; xoá CV = icon-only tách khỏi vùng click-mở (tránh nhầm); breadcrumb Home›Hồ sơ›CV cho route standalone. → [[content-linking]]
- **Psychology**: fluency — thumbnail là RENDER SỐNG thu nhỏ của chính CV (không phải icon generic) → giảm effort nhận diện "đây là CV nào", khác hẳn 1 icon giấy trắng chung cho mọi item. → [[persuasion-psychology]]
- **Ghi chú**: `CvEditor` tự funnel về `/courses` qua 1 `Alert status="accent"` ở cuối sidebar — điều kiện thật là `capstoneCount === 0` (`capstoneCount` = `milestoneTaskAttempts.length`, tức CHƯA có milestone-task nào được xác nhận qua 1 khóa đã enroll), KHÔNG PHẢI "hồ sơ/CV còn thiếu" (đó là ô completeness-meter riêng, tách biệt, không có CTA funnel). Đây là soft-link THẬT (đọc dữ liệu milestone/capstone thật để hiện trust badge hoặc mời enroll), không phải FK cứng CV↔khóa học — đúng luật "vùng rỗng/thiếu = lời mời học" ([[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]]), không phải ngõ cụt.
