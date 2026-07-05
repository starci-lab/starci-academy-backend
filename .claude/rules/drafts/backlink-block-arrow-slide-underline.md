# Draft — Back-link = block `BackLink` dùng chung (arrow trượt trái + label underline khi hover), KHÔNG hand-roll (2026-07-05)

- File/§ đích khi `/merge`: `elements/header.md` §3 (back-link) + `elements/list.md`/`elements/button.md` (nav affordance) + **đính chính** [[rating-scale-row-and-page-internal-rail-layout]] (back-link "text-muted hover:text-foreground" → giờ thêm arrow-slide + underline) + [[hover-style-matches-clickable-nature]] (mode 1 go-there → underline).
- Bối cảnh: màn Chỉnh sửa CV (`CvWorkspace` edit) để back thành Button tertiary "← Xem kết quả" bên PHẢI + Label "Chỉnh sửa CV" trái. Thầy: *"đọc kĩ rules, xóa chỉnh sửa cv, để cái back về trước, ghi là trở lại"* + *"back link trò làm kiểu arrow trượt qua trái, còn hover vô là hiện Link có underline"*. Đồng thời back-link đang hand-roll 3 kiểu khác nhau ở 4 chỗ (SubmissionResult/TaskResult muted no-hover · ChallengeView text-accent · CvWorkspace Button phải).

## Luật (STRICT)
- **Mọi back-link (affordance lùi của trang leaf/sub-view) = block `blocks/navigation/BackLink`, KHÔNG hand-roll `<Link>` + class tay.** 1 element = 1 component ([[single-source-render]]). API: `{ label?, target?, onPress, className? }` — omit hết → **"Trở lại"** (`common.goBack`); **`target`** = tên đích ghép vào nhãn generic → **"Trở lại {target}"** (`common.goBackTo`, vd `target="preview"` → "Trở lại preview") — ưu tiên dùng cho back-link mới; `label` = override trọn nhãn (giữ cho nhãn legacy "Quay lại thử thách"…).
- **Da chuẩn (block sở hữu):** `Link` `group flex w-fit cursor-pointer items-center gap-2 text-sm text-muted no-underline transition-colors hover:text-foreground` + `ArrowLeftIcon size-5` + label span. **Hover = arrow TRƯỢT QUA TRÁI** (`transition-transform group-hover:-translate-x-1`, mirror caret-slide của label-row [[elements/label]] §2) **+ label UNDERLINE** (`group-hover:underline` — mode go-there [[hover-style-matches-clickable-nature]]). KHÔNG text-accent (back không thuộc 4 vai accent — [[concepts/accent-system]]), KHÔNG pill/Button.
- **Vị trí = TOP-LEFT, slot `breadcrumb` của `PageHeader`** ([[elements/header]] §3). Back KHÔNG được là action-button bên phải.
- **View edit/compose là leaf "làm-1-việc" → back-link THAY luôn title + breadcrumb:** xóa Label/title thừa ("Chỉnh sửa CV" — nội dung form tự nói nó là gì), 1 affordance lùi duy nhất ([[leaf-page-one-nav-and-combined-tab-toolbar]]), nhãn generic "Trở lại".

## ĐÃ ÁP DỤNG 2026-07-05 (FE `D:\Repositories\starci-academy`, branch mtp)
- Tạo `blocks/navigation/BackLink` + i18n `common.goBack` (vi "Trở lại" / en "Back").
- `CvWorkspace` edit-mode: bỏ cả 2 nhánh header (PageHeader title+actions / Label+Button) → chỉ `<BackLink/>` ("Trở lại") trên đầu; xoá i18n mồ côi `cv.workspace.{editModeTitle,backToResults}`.
- Chuyển 3 chỗ hand-roll về block: `SubmissionResult` ("Quay lại thử thách") · `TaskResult` ("Quay lại dự án") · `ChallengeView` ("Quay lại bài học" — bỏ text-accent lệch, về muted chuẩn). tsc + eslint + JSON sạch.
- **Chưa đụng:** `reuseable/SubPageHeader` (gravity-ui icon, admin legacy) — khác vai (header có title), dọn khi chạm admin.
