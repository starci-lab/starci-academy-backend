# INDEX — Patterns (khung trang · flow dữ liệu · điều hướng)

> Bản đồ đầy đủ của shelf `patterns/`. Pattern = 1 TÌNH HUỐNG/LAYOUT/FLOW cụ thể (page shell, data-state, IA) — tổ hợp NHIỀU component lại thành 1 hình dạng lặp-lại-được. Khác `components/` (canon 1 element: Button, Card, Input…) và `principles/` (luật xuyên-suốt không neo 1 tình huống). Mỗi pattern archetype nên trỏ được về ≥1 route/shell THẬT trong `starci-academy` — pattern không grounded = lý thuyết suông.
>
> **Trạng thái:** ✓ = đã có, đầy đủ · **STUB** = mới viết brief (2026-07-07), cần dày thêm khi có case thật · **TODO** = biết thiếu, chưa viết.

## 1. Page shells / archetypes (khung trang)

| Pattern | Trạng thái | Vì sao dùng | Shell/route thật |
|---|---|---|---|
| [[page-shell-selection]] | STUB | Decision doc — hỏi trước khi chọn archetype cụ thể dưới | (meta, không neo 1 shell) |
| [[docs-three-pane-reader]] | STUB | Đọc tài liệu phân cấp sâu, duyệt cây liên tục trong lúc đọc | `LearnShell` — `/courses/[courseId]/learn/*` |
| [[master-detail-rail]] | STUB | 1 trục nav + list đủ dài, route KHÔNG có shell cây nội dung | `Practice` (`/practice`) · `SettingsLayout` (`/profile/settings/*`) |
| [[dashboard-hub]] | STUB | Nhiều khu ngang hàng cùng 1 identity, đổi bằng tab | `Dashboard` (`/dashboard`) · `PublicProfile` (`/profile/[username]`) |
| [[marketing-landing]] | STUB | Bán hàng/kể chuyện công khai, full-fold hero + stacked story | `Landing` (`/`, `/home`) |
| [[catalog-grid]] | STUB | Duyệt N item cùng loại, search+count+grid/line+pager | `CourseCatalog` (`/courses`) · `JobList` (`/jobs`) |
| course-detail | TODO | Marketing-first detail: hero + 2-col narrative/sticky-pricing | `CourseDetail` (`/courses/[courseId]`) |
| full-bleed-canvas | ✓ (2 file) | Canvas/tool chiếm trọn viewport, không chrome | mind-map (`/courses/[courseId]/mind-map`), challenge solve |
| feed-column | TODO | Feed dọc + composer + cursor-pagination "load more" | `CommunityFeed` (`/community`) |
| [[centered-form-setup]] | STUB | 1 tác vụ tập trung, review→action→CTA, không rail | `CartView` (`/cart`) · `JobPostForm` (`/jobs/post`) |
| modal-drawer-flow | TODO (partial) | Overlay flow: khi nào modal/drawer, đặt state ở đâu | `components/modals/*`, `components/drawers/*` |
| [[when-rail]] | ✓ | Test "kiếm được rail" — nền của câu hỏi 2 trong `page-shell-selection` | — |
| [[when-drawer]] | ✓ | Giấu nội dung phụ sau label+caret, mở Drawer | — |

*`full-bleed-canvas` = [[fullbleed-canvas-no-chrome-and-orient-zoom]] (canvas) + [[solving-surface-fullbleed-no-course-rails]] (giải-đề, giữ 1 back-link) — 2 file case-by-case, chưa có 1 file archetype tổng; `page-shell-selection` tạm gánh vai đó ở câu hỏi 1.*

## 2. Data-state flows (trạng thái dữ liệu)

| Pattern | Trạng thái | Vì sao dùng | Ghi chú |
|---|---|---|---|
| [[loading-feedback-three-tiers-splash-toploader-skeleton]] | ✓ | 3 tầng loading tách bạch: splash cold-load · top-bar nav SPA · skeleton region | — |
| [[asynccontent-remove-debug-hold]] | ✓ | Priority `error → loading → empty → content`, không debug-hold | Cặp với block `AsyncContent` |
| [[labeled-section-render-empty-not-self-hide]] | ✓ | Section có nhãn trên trang chủ-động-mở: rỗng → empty-state, không tự ẩn | — |
| [[meter-tracks-out-of-box-default-target]] | ✓ | Meter tiến độ chạy out-of-box, không rỗng chờ config | — |
| [[progress-block-growing-quantity-headline-not-vanity-strip]] | ✓ | Khối tiến độ = 1 đại lượng lớn dần làm headline, không stat-strip N số | — |
| [[layout-must-funnel-to-courses-and-cover-full-data-state-matrix]] | ✓ | Mọi surface có CTA vào khóa + phủ ma trận rỗng/1/N/overflow/mixed-variant | Neo cho §empty của mọi pattern §1 |
| [[search-filter-list-surface]] | STUB | Anatomy 4-phần: search·count·list·pager | Grounded ở `CourseCatalog`/`JobList` |
| infinite-scroll-feed | TODO | Cursor-pagination "load more" / auto-sentinel | `CommunityFeed` + `InfiniteScrollSentinel` |
| [[form-flow]] | STUB | RHF: validate → disable-on-invalid → submit → success-state | `JobPostForm` + `src/hooks/rhf/*` |

## 3. Navigation / IA (điều hướng & kiến trúc thông tin)

| Pattern | Trạng thái | Vì sao dùng | Ghi chú |
|---|---|---|---|
| [[course-home-no-duplicate-surfaces]] | ✓ | Home/hub không lặp lại surface đã có trang riêng / đã có trong sidebar | Cụm "home IA", xem Ghi chú gộp dưới |
| [[learn-home-surfaces-share-flat-chrome]] | ✓ | Các home trong khu Learn dùng chung 1 chrome flat | — |
| [[surface-lands-on-dashboard-no-auto-forward]] | ✓ | Surface có dashboard/overview phải land ở dashboard, không auto-forward | — |
| [[selection-anchored-entry-and-intent-state]] | ✓ | Entry point neo theo lựa chọn + state "ý định" không bị reset lúc mount | — |
| [[overlay-from-popover-render-in-panel]] | ✓ | Overlay phụ mở TỪ 1 popover → render in-panel, không Drawer/Modal body-level | — |
| breadcrumb-trail | TODO | Breadcrumb-chain vs back-link theo loại trang (đọc vs leaf-solve) | Rải ở `components/header.md` §3 |

## Ghi chú — ứng viên GỘP (khi `/merge`)

- **`when-rail` + `solving-surface-fullbleed-no-course-rails` + `fullbleed-canvas-no-chrome-and-orient-zoom`** → nội dung ĐẦY ĐỦ đã nằm ở 3 file riêng; `page-shell-selection.md` (mới) là LỚP DECISION đứng trên, KHÔNG thay thế. Khi `/merge`: cân nhắc rút "quy tắc gốc" của cả 3 vào `page-shell-selection.md` làm nguồn chính, 3 file cũ giữ làm phụ lục "Áp đầu"/case-by-case (đã có tiền lệ ở `accent-system` ⊇ `highlight-accent-as-detail-not-block-fill`, xem `README.md`).
- **`course-home-no-duplicate-surfaces` + `learn-home-surfaces-share-flat-chrome` + `surface-lands-on-dashboard-no-auto-forward`** (+ `continue-resumes-content-not-capstone` · `resume-cta-only-when-away` ở `product/`/`principles/`) → cùng 1 cụm "home/overview surface IA" (4-5 file cho đúng 1 câu hỏi: home của 1 surface phải làm gì, không được làm gì). Gộp thành 1 doc `overview-surface-ia.md` khi `/merge`; `dashboard-hub.md` (pattern shell mới) chỉ nói SHAPE, không thay các luật IA này.
- **`labeled-section-render-empty-not-self-hide` + `layout-must-funnel-to-courses-and-cover-full-data-state-matrix`** → cùng nói về empty-state nhưng 1 cái là luật chung (section có nhãn), 1 cái là luật riêng StarCi (empty = phễu về khóa). Giữ 2 file (khác phạm vi) nhưng đã cross-link 2 chiều.

## Ca biên (giữ trong `patterns/` dù mỏng, vì gắn chặt 1 layout/flow cụ thể)
`loading-feedback-three-tiers-splash-toploader-skeleton` · `overlay-from-popover-render-in-panel` · `selection-anchored-entry-and-intent-state` — nặng arch/build hơn layout thuần (gần `engineering/`), nhưng hành vi quan sát được là 1 FLOW trên trang → giữ ở đây theo lối `README.md` đã chốt ("Tầng 5 FE ARCH" tạm sống trong `patterns/concepts`).

## Cách dùng
- Mở 1 route MỚI → bắt đầu từ [[page-shell-selection]], rẽ vào archetype §1 đúng shape.
- Archetype đã chọn nhưng list/search/form bên trong chưa rõ hình → tra §2 (data-state flows) đúng tình huống (search list, form, infinite-scroll…).
- Đặt 1 surface MỚI vào IA tổng (home/dashboard/breadcrumb) → tra §3.
- Trước khi thêm 1 STUB mới thành ✓: gom case thật ("Shell/route" + "Áp đầu") giống các file ✓ khác trong shelf này — pattern không grounded vào route thật thì chưa đủ để lên ✓.
