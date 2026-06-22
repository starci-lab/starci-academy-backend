# Draft — Trang canvas full-bleed (mind-map): KHÔNG breadcrumb/chrome + default zoom = "bạn đang ở đâu" (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (layout/canvas) + **đính chính** [[header-gap2-and-breadcrumb-everywhere]] + [[three-tier-page-layout]] + `main.md` §14.
- Bối cảnh: trang Sơ đồ tư duy `/learn/mind-map` (React Flow full-bleed). Thầy: *"bỏ breadcrumb luôn được không"* + *"mặc định zoom tí"*.

## Luật (STRICT)
- **Trang CANVAS full-bleed (mind-map…) = KHÔNG breadcrumb, KHÔNG page-chrome.** Canvas sở hữu TRỌN viewport;
  breadcrumb/header ăn mất không gian + canvas đã có **định hướng riêng trên mặt canvas** (controls zoom/fit,
  node "Đang ở đây", legend). → **ĐÍNH CHÍNH** [[header-gap2-and-breadcrumb-everywhere]]: luật "MỌI trang `/learn/*`
  phải có breadcrumb" chỉ áp cho **trang ĐỌC** (reading column); **ngoại lệ = trang full-bleed** (`fullBleed` ở
  `LearnShell`, vd mind-map) — bỏ breadcrumb. (Trang đọc vẫn bắt buộc breadcrumb như cũ.)
- **Default camera của 1 bản đồ LỚN = orientation-first, KHÔNG fit-all.** Map 23 node mà `fitView` cả graph →
  node bé xíu, vô dụng. Mặc định phải **center vào node "bạn đang ở đây" (current task) ở zoom đọc được** (~0.8) để
  người học thấy NGAY "tôi đang ở đâu" cận cảnh; chỉ khi KHÔNG có current (guest / học hết) mới fit toàn graph.
  Nguyên tắc: *zoom mặc định phục vụ "đang ở đâu / làm gì tiếp", không phải khoe toàn cảnh thu nhỏ.*
- **Hệ quả:** xoá component breadcrumb riêng của canvas khi gỡ (dead code); `useMindMapFitView(currentModuleId)`
  nhận con trỏ current để chọn tâm; fit-all chỉ là fallback.
