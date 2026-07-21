# Layout — CÔNG VIỆC của bề mặt CHỌN shell; feature nhiều-pha ĐỔI shell theo pha

> ⭐ Luật gốc của kệ `layouts/`. Trước khi dựng 1 trang, KHÔNG hỏi "trang này trông thế nào" mà hỏi **"bề mặt này
> đang làm CÔNG VIỆC gì?"** — job chọn shell. Web ground: adaptive layout (layout đổi theo *modality/task*, không cứng
> 1 khung — [Material](https://m2.material.io/design/layout/understanding-layout.html) · [Fluent 2](https://fluent2.microsoft.design/layout)); focus-mode (VS Code / focus browser **ẩn nav** để tập trung 1 việc).

## Job → shell (hỏi job, rẽ shell)
| Job của bề mặt | Shell | Archetype |
|---|---|---|
| **Đọc / duyệt** tài liệu phân cấp | 3-pane (rail cây + đọc + TOC) | [[docs-three-pane-reader]] |
| **Duyệt N item cùng loại** | catalog grid/line + pager | [[catalog-grid]] |
| **Quyết / nhập** 1 tác vụ (form, setup, checkout) | centered 1 cột, không rail | [[centered-form-setup]] |
| **LÀM-VIỆC-TẬP-TRUNG có tool** (giải đề · phỏng vấn · thiết kế) | **full-bleed, bỏ rail, 2-pane** | [[full-bleed-work-surface]] · [[solving-surface-fullbleed-no-course-rails]] |
| **Tổng quan** nhiều khu cùng identity | dashboard-hub (tab strip) | [[dashboard-hub]] |
| **Kết quả / debrief** | centered 1 cột | ([[centered-form-setup]] shape) |
| **Bán hàng / kể chuyện** công khai | landing stacked | [[marketing-landing]] |
- Chọn shell cụ thể → cây quyết định [[page-shell-selection]]. Từ vựng vùng → [[region-model]].

## Feature NHIỀU PHA = nhiều job trong 1 route → ĐỔI SHELL theo pha (STRICT)
- **1 route nhưng đi qua N pha có JOB KHÁC NHAU → mỗi pha dùng shell của job đó, KHÔNG khoá cứng 1 khung cho cả feature.** Ép mọi pha vào 1 shell = pha nào job khác sẽ bị bóp méo (thường pha "làm-việc" bị nhồi vào cột đọc hẹp).
- Dấu hiệu sai: 1 state-machine `phase` render mọi pha trong CÙNG `max-w-*` centered + CÙNG rail — trong khi 1 pha là solve/interview cần full-bleed.
- Chuyển shell theo pha là **adaptive-by-task** (không chỉ adaptive-by-viewport): pha đổi job → layout đổi.

## Áp đầu (2026-07-07 chốt · 2026-07-08 xác nhận ĐÃ ÁP trong source) — Mock Interview
`MockInterviewSession` đổi shell theo pha, ĐÚNG job:
- **setup** (quyết/green-room) → centered · **interview** (làm-việc + tool) → **full-bleed 2-pane, bỏ rail** ([[full-bleed-work-surface]]) · **grading** (chờ) → centered interstitial · **scorecard** (kết quả) → centered.
- Xác nhận trong source (2026-07-08, đọc `MockInterviewSession/index.tsx` + `learn/layout.tsx`): route bật `fullBleed` khi `phase==="interview"` (mirror qua `?phase=` URL) đúng đã áp; `mock-interview` vốn KHÔNG có rail ở bất kỳ pha nào (không nằm trong điều kiện `leftRail` của `learn/layout.tsx`) nên không có gì để "tắt" — `fullBleed` chỉ bỏ padding/max-width đọc-cột, không liên quan rail.
- **Bug phát sinh khi build (đã fix 2026-07-08):** workspace `qna` (bung-theo-yêu-cầu) dùng 1 state cấp-phiên `workspaceOpen`, tự mở khi câu có `givenCode` nhưng KHÔNG tự đóng lại cho câu sau không cần — workspace dính mở hết phiên. Fix: thêm `workspaceAutoOpenedRef` phân biệt auto-open (đóng lại được ở câu sau) vs manual-open (user tự bấm, giữ nguyên). Ref [[full-bleed-work-surface]] §Áp đầu.

## Áp đầu (2026-07-08) — Flashcards "Hỏi nhanh" (InterviewSession), nhẹ hơn Mock Interview
Cùng anti-pattern nhưng NHẸ hơn: `Flashcards/index.tsx` bọc CẢ 3 pha (`setup`/`active`/`recap`) trong 1 `mx-auto max-w-3xl` — surface đã rail-less sẵn (không bị khoá rail như Mock Interview), nhưng pha `active` (làm-việc: cloze fill-blank + word bank) vẫn bị bó cùng width với pha "quyết"/"kết-quả". Fix: `InterviewSession` báo `phase` lên qua prop `onPhaseChange` (KHÔNG cần mirror URL như Mock Interview — parent là component cha trực tiếp, không phải layout ở tầng khác); `Flashcards/index.tsx` đổi `max-w-3xl` → `max-w-5xl` CHỈ khi `mode==="interview" && phase==="active"`. Không cần 2-pane (task nhẹ, không cần workspace phụ) — chỉ nới rộng 1 cột. Ruling: **cách báo phase lên phụ thuộc khoảng cách trong cây component** — parent liền kề dùng prop/callback đơn giản; parent ở tầng layout khác (ngoài subtree) mới cần mirror qua URL query param.

## Liên quan
[[page-shell-selection]] (chọn shell cụ thể) · [[full-bleed-work-surface]] · [[region-model]] · [[responsive-regions]] · `product/assessment-surface-integrity-and-grade-at-end` (Luật 3 workspace tool-tabs) · `patterns/layout-must-funnel-to-courses-and-cover-full-data-state-matrix` (mỗi pha vẫn phủ state + phễu).
