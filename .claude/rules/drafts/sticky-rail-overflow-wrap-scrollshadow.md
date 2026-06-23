# Draft — Rail/panel sticky có thể tràn viewport: bọc nội dung trong HeroUI `ScrollShadow` (fade mép), KHÔNG để overflow trần (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (rail/scroll patterns) + [[three-tier-page-layout]] + [[rail-long-title-and-spacing]].
- Bối cảnh: trang giải challenge, cột phải "Nộp bài" (sticky `xl:max-h-[calc(100dvh-7rem)] overflow-y-auto`). Panel dài (form nộp + token + kết quả) tràn quá chiều cao viewport → scroll cụt, không có gợi ý "còn nội dung dưới". Thầy: *"render bên phải dạng Shadow Scrolling"*.

## Luật (STRICT)
- **Mọi rail/panel sticky có chiều cao bị giới hạn (`max-h-[calc(100dvh-*)]`) + có thể overflow → nội dung bọc trong block HeroUI `ScrollShadow`**, KHÔNG để `overflow-y-auto` trần trên container. ScrollShadow tự fade mép trên/dưới khi còn nội dung scroll → người dùng biết "còn nữa", không bị cắt cụt đột ngột.
- **Tách vai:** container NGOÀI lo **vị trí** (`sticky top-* w-* self-start`), `ScrollShadow` TRONG lo **overflow + max-h + shadow** (`flex flex-col gap-* max-h-[...] overflow-y-auto`). Đừng nhồi cả sticky + overflow + shadow vào 1 thẻ.
- **`hideScrollBar`** cho gọn (khớp `OutlineRail`/`CollapsibleSidebar` của repo). Shadow chỉ hiện khi thật sự overflow (ScrollShadow tự ẩn khi đủ chỗ) → mobile/full-width (không max-h) không bị shadow thừa.
- **Dùng block có sẵn, đừng tự chế CSS scroll-shadow:** repo đã có `ScrollShadow` (HeroUI) dùng ở `OutlineRail`, `CollapsibleSidebar`, `E2eResultDrawer` → tái dùng, KHÔNG hand-roll `linear-gradient + background-attachment`.

## ĐÃ ÁP DỤNG 2026-06-24
- `ChallengeView` cột phải: `<aside sticky w-[360px]>` → bọc cards trong `<ScrollShadow hideScrollBar className="flex flex-col gap-6 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto">`. Gỡ `overflow-y-auto`/`max-h` khỏi aside. tsc/eslint sạch.
