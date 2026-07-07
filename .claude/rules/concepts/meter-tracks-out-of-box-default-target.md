# Concept — Meter tiến độ phải CHẠY out-of-box (default target), không rỗng chờ config

> Heuristic (họ `concepts/*`). Rút từ "Mục tiêu tuần" rỗng dù đã học (2026-06-25). Bổ trợ [[progress-block-growing-quantity-headline-not-vanity-strip]].

## Quy tắc (STRICT)
- **Meter "tiến độ tới mục tiêu" (weekly goal, KPI, quota…) KHÔNG được đứng im/rỗng chỉ vì user CHƯA tự đặt target.** Cho **default target hợp lý** → có hoạt động là bar chạy ngay; user vẫn override được (nút Sửa). Để rỗng-chờ-config = user tưởng "hỏng, không chạy" (thầy: *"có học thì progress có chạy chứ?"*).
- **Logic 3 phần:** `current` = hoạt động THẬT (tăng khi dùng) · `target` = custom HOẶC default · `percent = current/target`. Dùng **`effectiveTarget = custom ?? default`** ĐỒNG NHẤT cho bar + display (`current/target`) + summary → không lệch.
- **Default đặt ở NGUỒN (BE) là lý tưởng** (editor/Sửa cũng thấy cùng số). FE-only default chấp nhận tạm (nhanh) nhưng editor sẽ hiện trống tới khi user set → ghi nợ đồng bộ.
- **Bar render reliable = div thường** (`bg-default` track + `bg-accent` fill `width:%`), luôn render; KHÔNG phụ thuộc compound component dễ "mất style" theo ngữ cảnh.
- **Phân biệt:** đây là "meter có mốc" (cần target). Khác meter "đại lượng lớn dần" (mastery — [[progress-block-growing-quantity-headline-not-vanity-strip]]) đã có mẫu số tự nhiên (tổng thẻ). Cả hai: KHÔNG để meter vô nghĩa/rỗng — luôn có mẫu số để fill.

## Áp đầu (2026-06-25)
- `WeeklyGoals`: `DEFAULT_KPI_TARGETS` (lessons 5·studyDays 5·challenges 3·coding 3·flashcards 20); effective target cho bar/display/summary → có học là bar chạy. Token heatmap "mất màu" → [[heatmap-trong-la-bug-token-khong-redesign]] (bug token, không redesign).
