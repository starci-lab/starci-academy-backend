# Layout — Bề mặt LÀM-VIỆC full-bleed 2-pane (giải đề · phỏng vấn · thiết kế có tool)

> Archetype cho job "làm-việc-tập-trung 1 việc + cần tool" (khác canvas thuần [[fullbleed-canvas-no-chrome-and-orient-zoom]] và
> giải-đề-đọc-1-cột [[solving-surface-fullbleed-no-course-rails]]). Web ground: focus-mode (VS Code secondary side-bar,
> browser focus) **ẩn nav site** để dồn màn cho việc; CoderPad/interviewing.io = context ↔ workspace 2-pane.

## Khung (STRICT)
- **Full-bleed, BỎ rail khóa + chrome** (route bật `fullBleed`) — rail điều hướng khóa lúc này chỉ gây nhiễu. Đường lùi = **1 back-link "← Thoát"** là đủ ([[solving-surface-fullbleed-no-course-rails]] tinh thần).
- **2 pane:** TRÁI = **context/hội thoại** (đề · người phỏng vấn · câu hỏi · tiến độ · ô trả lời) · PHẢI = **workspace TOOL-TABS** (Whiteboard · Code · Ghi chú — [[tabs]] / `product/assessment-surface-integrity-and-grade-at-end` Luật 3). Workspace là **pane HẠNG NHẤT**, KHÔNG toggle "+ thêm" ẩn dưới.
- Grid `lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`; mỗi pane cuộn riêng (`ScrollShadow`), không để cả trang cuộn.

## 2-pane CỨNG vs workspace BUNG-THEO-YÊU-CẦU (chọn theo tần suất cần tool)
- **2-pane cứng** khi việc **luôn** cần workspace: thiết kế hệ thống (vẽ suốt), giải code (gõ suốt).
- **1 cột rộng + pane bung theo yêu-cầu** khi **đa số câu KHÔNG cần tool** (vd phỏng vấn Q&A trả lời bằng lời): full-bleed 1 cột rộng, workspace mở khi câu cần (câu debug ship given-code → tự mở pane Code). Giữ quyết định sư phạm "đừng phí nửa màn cho câu không cần vẽ/code" mà vẫn full-bleed (hết cramped). → mặc định chọn cái này cho Q&A.
- **Đừng** để workspace thành 1 link "+ thêm" ẩn dưới cột hẹp (bug Mock Interview hiện tại).

## Mobile
2-pane → **xếp dọc**: context trên, workspace = 1 tab-strip/collapsible dưới ([[responsive-regions]]). 1 việc/màn, không nhồi 2 pane cạnh nhau trên màn hẹp.

## Áp đầu (2026-07-07 chốt · 2026-07-08 xác nhận ĐÃ ÁP + fix 1 bug)
Mock Interview pha `interview`: **bung-theo-yêu-cầu cho `qna`** (1 cột rộng, pane Code tự mở khi given-code, `MockInterviewSession/index.tsx`) · **2-pane cứng cho `design`** (whiteboard suốt) — 1 shell full-bleed chung, khác nhau ở lúc-mở-pane. Route bật `fullBleed` khi `phase===interview`; workspace = pane hạng nhất (nút mở/ẩn, không phải toggle "+ thêm" ẩn dưới). Prototype: `fe/prototypes/mock-interview.html`.
- **Bug đã fix (2026-07-08):** `workspaceOpen` là state CẤP-PHIÊN, tự mở đúng khi câu có `givenCode` nhưng KHÔNG tự đóng cho câu sau không cần → workspace dính mở hết phiên (phá đúng ý "bung theo yêu cầu", vi phạm §2 dòng trên "đừng phí nửa màn cho câu không cần"). Fix: `workspaceAutoOpenedRef` (ref, không phải state — bookkeeping thuần) đánh dấu open do AUTO (givenCode) hay MANUAL (user tự bấm "Thêm phác thảo"); câu sau không cần code → chỉ auto-đóng khi ref=auto, GIỮ NGUYÊN khi user tự mở (không clobber notes user đang viết).
- Ref [[surface-job-drives-layout]] §Áp đầu.

## Đính chính (2026-07-13) — Q&A đổi từ "1 cột co-giãn" sang "2-pane LUÔN + EmptyState"
Thầy đảo ngược phần "bung-theo-yêu-cầu" ở trên cho `qna`: **KHÔNG còn co về 1 cột khi câu không cần tool** — pane phải **LUÔN hiện** (grid 2-pane cố định, giống `design`), chỉ đổi NỘI DUNG bên trong pane phải:
- Câu có tool (`questionHasWorkspaceTool(...)` true) → render `MockInterviewWorkspace` như cũ.
- Câu không cần tool → render `EmptyState` trần (KHÔNG card frame — xem sửa bên dưới) thay vì ẩn hẳn pane hoặc co cột trái lại `max-w-2xl`.
- Bỏ hẳn nút toggle thủ công "Ẩn/hiện công cụ" ở header (`WorkSessionHeader`'s `rightSlot`) — `workspaceOpen` giờ chỉ do câu hỏi quyết định (qua các effect có sẵn `questionHasWorkspaceTool(...)`), không còn override tay.
- Lý do đảo: pane trống-hẳn/co cột đọc như layout nhảy giữa các câu (khó chịu hơn 1 EmptyState tĩnh); và nút toggle ẩn/hiện là thao tác thừa khi hệ thống đã tự biết câu nào cần tool.
- **Rule "2-pane cứng cho `design`" ở trên KHÔNG đổi** — case đó vốn đã luôn 2-pane, không có EmptyState (whiteboard dùng suốt).
- Áp tại `MockInterviewSession/index.tsx` (nhánh `qna` của phase `interview`). `fe/components/` chưa có doc riêng cho `WorkSessionHeader`/`EmptyState` — dùng đúng 2 block đã có sẵn trong `components/blocks/navigation/WorkSessionHeader` và `components/blocks/feedback/EmptyState`, không tự chế.

**Sửa tiếp cùng ngày — bỏ card-frame, dùng divider giữa 2 pane thay vì `gap-6`:** thầy: "2 card này phèn quá" — 2 pane mỗi bên 1 khối `bg-surface shadow-surface` rời rạc cạnh nhau đọc rối/"kẻ ô". Fix:
- **KHÔNG card frame ở pane phải** — bỏ hẳn `rounded-2xl bg-surface shadow-surface` quanh `EmptyState`, render trần (EmptyState tự đủ, [[card]] "không 2 card liên tiếp" áp cả ở đây dù là 2-pane ngang chứ không phải stack dọc).
- **Thay `gap-6` (khoảng trắng) giữa 2 pane bằng 1 divider dọc** (`lg:border-l lg:border-default`) + padding cân xứng `lg:pr-6`/`lg:pl-6` mỗi bên (grid tự nó `lg:gap-0`). Đây là ngoại lệ CÓ CHỦ Ý của [[whitespace-over-dividers]] — rule đó áp cho stack DỌC trong 1 rail (ngăn bằng gap là đủ); ở đây là 2 pane NGANG cùng 1 work-surface, thầy muốn 1 đường phân tách rõ thay vì khoảng trắng. Tỷ lệ gap-quanh-divider mượn từ [[gap]] ("divider đã gánh việc phân tách, đừng cộng thêm gap lớn") — `pl-6`/`pr-6` symmetric, không cộng thêm `gap-6` grid nữa.
- Mobile: KHÔNG có divider (border chỉ `lg:`), 2 pane xếp dọc vẫn ngăn bằng `gap-6` như cũ — không đổi.

**Sửa tiếp cùng ngày — divider phải kéo dài FULL viewport, không chỉ theo content height:** thầy: "divider kéo dài full ấy". Nguyên nhân: `MockInterviewSession` (nhánh `qna`) chưa khoá chiều cao — root chỉ `flex w-full flex-col` (không `h-[calc(100dvh-4rem)]`), nên grid 2-pane cao THEO CONTENT (bao nhiêu vừa đủ) chứ không cao theo phần còn lại của viewport → divider dừng đúng ngay dưới nội dung, đọc như "chưa full". Fix — khoá theo ĐÚNG convention `fullBleed` khác đã dùng (`MindMap`, `PlaygroundSession` đều `h-[calc(100dvh-4rem)]`, cùng offset navbar `4rem`/`top-16`):
- Root return của nhánh `qna`: `h-[calc(100dvh-4rem)]` thay vì chỉ `flex w-full flex-col`.
- Grid 2-pane bên trong: thêm `flex-1 min-h-0 overflow-y-auto` — `flex-1` chiếm hết phần còn lại DƯỚI `WorkSessionHeader` (sticky, vẫn nằm trong luồng nên tự trừ đúng chiều cao của nó, không cần tính tay 2 tầng offset); `min-h-0` là fix kinh điển để flex-child co được trong flex-col (không thì content dài sẽ đẩy tràn); `overflow-y-auto` cho pane này tự cuộn thay vì cả trang cuộn, đúng [[full-bleed-work-surface]] "mỗi pane cuộn riêng".
- **CHƯA áp cho nhánh `design`** (phase khác trong cùng file) — cùng 1 gap tiềm ẩn (root cũng chỉ `flex w-full flex-col`, không khoá viewport) nhưng ngoài phạm vi feedback lần này; cần soát riêng nếu muốn nhất quán.

**Sửa tiếp cùng ngày — ĐẢO NGƯỢC quyết định divider ở trên: bỏ hẳn, quay lại `gap-6` thuần:** thầy xem lại sau khi divider đã kéo full height (đoạn ngay trên) rồi vẫn chốt "bỏ divider đi". Lý do gốc dẫn tới divider (§ "2 card này phèn quá") đã tự hết khi bỏ card-frame khỏi `EmptyState` — không còn 2 khối `bg-surface` cạnh nhau để cần 1 đường tách rõ nữa, nên quay lại mặc định [[whitespace-over-dividers]] (KHÔNG còn là ngoại lệ như ghi ở trên). Fix: bỏ `lg:border-l lg:border-default` + `lg:pl-6`/`lg:pr-6`/`lg:gap-0`, trả grid về `gap-6` đơn giản (áp dụng đều mobile lẫn desktop, không cần variant `lg:` riêng nữa). Phần khoá viewport-height (đoạn trên) KHÔNG đổi — vẫn giữ `h-[calc(100dvh-4rem)]` + `flex-1 min-h-0 overflow-y-auto`, chỉ đổi cách 2 pane NGĂN NHAU (divider → whitespace), không đổi CHIỀU CAO pane.
- **Bài học cho lần sau:** khi thầy phàn nàn "2 card phèn", ưu tiên hỏi/thử bỏ card-frame trước khi nhảy sang thêm divider — divider là bước 2 (chỉ cần khi card-frame không phải nguyên nhân chính), không phải phản xạ đầu tiên. [[whitespace-over-dividers]] vẫn là mặc định đúng cho case 2-pane work-surface này.

## Đính chính (2026-07-17) — pane WORKSPACE (phải) = PANEL DOCK sát mép, border-l (KHÔNG card bo góc)
Đảo phần "KHÔNG card frame ở pane phải" (2026-07-13 ở trên) qua **2 nhịp thầy chốt trong 1 phiên** — GIỮ nhịp cuối:
- **Nhịp 1 (thầy: "render nguyên surface bên phải, có border, gap-6 render code bên trong"):** trò lỡ hiểu = card `rounded-2xl border bg-surface p-6` nổi (inset cả 4 mép). **SAI.**
- **Nhịp 2 — CHỐT (thầy: "ý là height full và sát mép phải, bên trái có border"):** pane phải = **PANEL DOCK kiểu IDE**, KHÔNG phải card nổi: **tràn sát mép PHẢI + TRÊN + DƯỚI của viewport, full chiều cao, CHỈ có `border-l` ngăn với hội thoại** (không bo góc, không `bg-surface`, không border 4 cạnh). `p-6` bên trong cho tool thở khỏi border/mép (đây là "gap-6" nhịp 1).
- **Cách tràn mép:** BỎ padding ngang khỏi grid CONTAINER (`grid ... lg:grid-cols-[1fr_1fr]`, không `px`/`gap`); **pane TRÁI tự mang padding đọc** (`px-4 py-6 sm:px-6 lg:overflow-y-auto`); **pane PHẢI** `border-l border-default p-6` + fill row (grid stretch = full height) → tự chạm mép phải/trên/dưới. Mobile (stack): `border-t` thay `border-l` + `min-h-[28rem]` cho editor có chiều cao, cả body cuộn chung (`overflow-y-auto`, `lg:overflow-hidden` để lg cuộn theo pane).
- **Tool KHÔNG border/khung riêng** (panel đã gánh border-l): `MockInterviewWorkspace` bỏ khung code-card + header-fill → 1 hàng label/picker ngôn ngữ trên editor (`gap-3`), editor themed-bg + `rounded-xl overflow-hidden`. `MockInterviewDiagram` bỏ `border border-divider` ngoài (giữ `rounded-xl` + header `border-b` nội bộ).
- Áp cả `qna` (gồm cả `EmptyState`) lẫn `design`. **Vẫn giữ** khoá viewport-height (`h-[calc(100dvh-4rem)]` + `flex-1 min-h-0`). `gap-6` NGĂN 2 pane cũ giờ THAY bằng `border-l` (chính là divider thầy muốn — nhưng chỉ 1 bên, không phải card 4 cạnh).
- **Bài học:** "surface có border" của thầy = panel-dock-border-l, KHÔNG mặc định là card-bo-góc-4-cạnh — hỏi rõ "tràn mép hay nổi" trước khi chọn `rounded-2xl` vs `border-l`.

## Liên quan
[[surface-job-drives-layout]] · [[solving-surface-fullbleed-no-course-rails]] · [[fullbleed-canvas-no-chrome-and-orient-zoom]] · [[page-shell-selection]] (câu hỏi 1) · [[responsive-regions]] · [[tabs]] · `product/assessment-surface-integrity-and-grade-at-end`.
