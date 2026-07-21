# Layout — Sticky (CHỐT 2026-06-24)

> Hành vi sticky mặc định cho rail/panel/phần tử bám khi scroll.

## Mặc định: pin GẦN VỊ TRÍ NGHỈ (đứng yên), KHÔNG giật lên flush
- Phần tử sticky (purchase card cột phải, sub-header, tab strip) khi scroll phải **pin ở ngay gần vị trí nghỉ của nó** — trông như **đứng yên**, KHÔNG bị "kéo lên sát" flush vào navbar.
- **Offset chuẩn = `sticky top-[88px]`** = **navbar `h-16` (64px) + padding-top cột `py-6` (24px) = 88px** = ĐÚNG vị trí nghỉ của phần tử. Pin ngay tại đó → khi scroll card **đứng yên**, KHÔNG nhúc nhích/giật. Kèm `self-start`. (top-22 = 88px nhưng 22 không có trong scale Tailwind mặc định → dùng arbitrary `top-[88px]`.)
- Công thức: `top = chiều-cao-navbar + padding-top-của-cột-chứa`. Trang khác padding khác → tính lại (vd cột `py-8` → `top-[96px]`).
- **CẤM `top-16` (flush sát navbar)** cho card/rail có padding cột phía trên: pin CAO hơn vị trí nghỉ → scroll bị **giật/kéo lên sát mép** (thầy bác 2026-06-24). `top-16` chỉ cho phần tử vốn chạm mép (full-bleed, không padding trên).
- Container ngoài lo VỊ TRÍ (`sticky top-[88px] self-start`); nội dung dài vượt viewport → bọc `ScrollShadow` (max-h + overflow), KHÔNG overflow trần. Ref [[sticky-rail-overflow-wrap-scrollshadow]].

## Scroll giữ nhịp header
- Khi cuộn, **phần header trên (breadcrumb/title/desc/chips — vùng "đỏ") giữ nguyên gap/nhịp**; chỉ nội dung dưới cuộn. Sticky element bám mép, header không bị nén. Ref [[gap]].

## Phân biệt
- **Sticky** (bám trong luồng, `position: sticky`) cho rail/sub-header — dùng cái này mặc định.
- KHÔNG `position: fixed` cho rail nội dung (chỉ navbar/overlay mới fixed).
- Sidebar identity (hồ sơ) = KHÔNG sticky; tab-strip/sub-header ngang đầu trang = sticky `top-20` (mặc định; `top-16` chỉ khi phần tử chạm mép, không padding trên).
