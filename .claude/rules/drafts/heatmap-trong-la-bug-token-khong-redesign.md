# Draft — "Heatmap trơn/nhạt" = BUG token CSS chưa định nghĩa, KHÔNG phải vấn đề UX → fix token, đừng redesign (2026-06-22)

- File/§ đích khi `/merge`: `main.md` §1/§14 (debug-first heuristics) + `starci-ui.rules` (token/heatmap).
- Bối cảnh: thầy chỉ khối "Hoạt động học" (contribution heatmap) trên dashboard overview *"sao hồng trắng trơn thế này"*.
  Mình đi brainstorm lại UX (12 tuần, streak-first, hybrid…) rồi apply Direction C. Thầy bác: *"cái heatmap full đi để
  thầy kéo bằng framer-motion như hồi đầu đi"* → gốc rễ chỉ là **bug token màu**, không cần đổi layout.

## Luật (STRICT)
- **Khi 1 element render "nhạt/trơn/mất màu", NGHI BUG TRƯỚC khi nghĩ redesign.** Soi computed style / token thật: rất
  hay gặp `bg-[var(--xxx)]` mà `--xxx` **chưa được định nghĩa** trong `globals.css` → CSS var vô hiệu → nền trong suốt
  → "trơn". Đây là lỗi 1 dòng, KHÔNG phải lỗi UX. Sửa token là xong; đừng đập đi xây lại layout.
  - Vụ này: `ContributionCalendarView` tô ô bằng `--heat-0..4` nhưng `globals.css` chưa khai → fix = thêm thang
    `--heat-*` (ramp pink hue 354, light+dark, `--heat-0 = var(--default)` track rỗng). Heatmap full-year +
    framer-motion drag + year-switcher GIỮ NGUYÊN như cũ.
- **Đừng nhiểu "than phiền hiển thị" thành "yêu cầu redesign".** Thầy nói "trơn" = "sao nó mất màu", KHÔNG phải "đổi
  bố cục". Hỏi/chẩn đoán nguyên nhân hiển thị trước; chỉ redesign khi vấn đề thật sự là IA/luồng, không phải style bug.
- **Heatmap rỗng (0 hoạt động) VẪN render lưới** (không thay bằng message/empty-state) — một khi `--heat-0` có màu
  track thật thì lưới rỗng tự nó là empty state hợp lệ (giống GitHub khi chưa commit). Thầy chốt: full + kéo được,
  kể cả khi chưa có data.
- **Token bug sửa ở globals.css là fix HỆ THỐNG:** cùng `ContributionCalendarView` dùng ở cả profile (year-mode) →
  định nghĩa `--heat-*` 1 chỗ chữa cho mọi nơi. Đừng vá màu lẻ ở feature.

## ĐÃ LÀM 2026-06-22
- Thêm `--heat-0..4` (light + dark) vào `D:\Repositories\starci-academy\src\app\globals.css`. Revert mọi thay đổi
  layout (variant recent / streak / empty-state) — heatmap về đúng full-year draggable ban đầu. Net change = chỉ token.
- (Brainstorm doc `OverviewContributions/UX-BRAINSTORM.md` giữ lại làm hồ sơ, nhưng hướng C đã bị bác — gốc là bug token.)
