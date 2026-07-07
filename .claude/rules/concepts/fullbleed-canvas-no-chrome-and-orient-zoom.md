# Concept — Trang CANVAS full-bleed (mind-map): KHÔNG breadcrumb/chrome + default zoom = "bạn đang ở đâu"

> Heuristic (họ `concepts/*`). Bổ sung [[when-rail]] (full-bleed bỏ rail) + đính chính [[elements/header]] (breadcrumb everywhere) cho trang canvas.

## Quy tắc (STRICT)
- **Trang CANVAS full-bleed (mind-map, sơ đồ chiếm trọn viewport) = KHÔNG breadcrumb, KHÔNG page-chrome.** Canvas sở hữu TRỌN viewport; breadcrumb/header ăn mất không gian + canvas đã có **định hướng riêng trên mặt canvas** (controls zoom/fit, node "Đang ở đây", legend).
- **ĐÍNH CHÍNH luật "MỌI trang `/learn/*` phải có breadcrumb"** ([[elements/header]]): luật đó áp cho **trang ĐỌC** (reading column). **Ngoại lệ = trang full-bleed** (`fullBleed` ở `LearnShell`, vd mind-map) → bỏ breadcrumb. Trang đọc vẫn bắt buộc breadcrumb như cũ.
- **Default camera của 1 bản đồ LỚN = orientation-first, KHÔNG fit-all.** Map nhiều node mà `fitView` cả graph → node bé xíu, vô dụng. Mặc định phải **center vào node "bạn đang ở đây" (current task) ở zoom đọc được** (~0.8) để người học thấy NGAY "tôi đang ở đâu" cận cảnh; chỉ khi KHÔNG có current (guest / học hết) mới fit toàn graph.
  - Nguyên tắc: *zoom mặc định phục vụ "đang ở đâu / làm gì tiếp", không phải khoe toàn cảnh thu nhỏ.*
- **Hệ quả:** xoá component breadcrumb riêng của canvas khi gỡ (dead code); hook fit-view nhận con trỏ current để chọn tâm; fit-all chỉ là fallback.

## Liên quan
- [[when-rail]] (canvas full-bleed → bỏ rail) · [[solving-surface-fullbleed-no-course-rails]] (cùng họ: surface tập trung → full-bleed, bỏ chrome/rail) · [[elements/header]] (breadcrumb — ngoại lệ full-bleed).
