# Pattern — Docs 3/4-pane reader (icon-rail · content-tree · reading column · on-this-page TOC)

> Shell/route: `src/components/features/learn/LearnShell` (mọi route `/courses/[courseId]/learn/*`). Archetype "tài liệu kỹ thuật" (Stripe Docs/Docusaurus): duyệt cây nội dung TRÁI, đọc GIỮA, định hướng-trong-bài PHẢI.

## Khi nào dùng
- Nội dung PHÂN CẤP sâu (module → bài → mục) cần duyệt LIÊN TỤC trong lúc đọc — không phải 1 tác vụ đơn lẻ. Chỉ 2-3 mode (không phải cây thật) → không phải archetype này, quay lại [[page-shell-selection]].

## Region map (trái → phải)
1. **Icon-rail** (`LearnSidebar`, luôn hiện `lg+`) — chuyển SURFACE↔SURFACE (nội dung/thử thách/leaderboard/personal-project…), sticky `top-16` full-height, tự lo scroll/divider/collapse.
2. **Content-tree rail** (`leftRail` prop, vd `ContentMap`) — cây module→bài của SURFACE hiện tại, LUÔN hiện (không collapse), route layout truyền vào.
3. **Reading column** (`children`) — nội dung chính, `max-w-3xl mx-auto`; **`p-6` do SHELL sở hữu** — feature KHÔNG tự khai `p-*` (trừ `fullBleed`).
4. **On-this-page rail** (`rightRail` prop, vd `OutlineRail`/milestone rail) — TOC trong-bài, optional per route; `showRightCollapse` bật handle redux-driven khi cần.
- **Mobile (`<lg`):** 4 cột gập vào `LearnMobileTabBar` (bottom tabs) khi có `leftRail`; route KHÔNG-reader dùng `LearnMobileBar` (drawer bar) qua `simpleMobileBar`.
- **Full-bleed opt-out:** canvas tràn viền (mind-map) → `fullBleed` bỏ `p-6` + bỏ rail — không còn archetype này, xem [[fullbleed-canvas-no-chrome-and-orient-zoom]].

## Liên quan
[[when-rail]] · [[learn-home-surfaces-share-flat-chrome]] (home của mỗi surface dùng CHUNG chrome này) · [[fullbleed-canvas-no-chrome-and-orient-zoom]] · sidebar (component canon: `LearnSidebar`/`OutlineRail`) · header (component canon: breadcrumb slot) · [[page-shell-selection]].
