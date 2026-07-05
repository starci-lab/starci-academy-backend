# Draft — Chọn 1-trong-N DOCUMENT bền (CV, sheet…) = DOCUMENT TABS gộp vào 1 toolbar (`TabsCard` leftTabs + `leftEnd` ⌄/+) — KHÁC attempt-history (chip strip) (2026-07-05)

- File/§ đích khi `/merge`: `elements/` (tabs) + [[tabscard-two-secondary-groups]] (thêm slot `leftEnd`) + phân ranh với [[attempt-history-selector-adaptive-and-grading-model-chip]] + [[single-select-among-options-use-tabs]] + [[leaf-page-one-nav-and-combined-tab-toolbar]].
- Bối cảnh: `CvWorkspace` vùng "Các CV của bạn" — 4 hàng control chồng (label+nút · recruiter line · chip dial 3 kebab · TabsCard Kết quả/Xem trước). Thầy: *"layout chưa ổn"* → *"render dạng tabs được không"* → chốt hướng A (1 toolbar gộp).

## Luật (STRICT)
- **Chọn 1-trong-N khi item là DOCUMENT BỀN (có tên + hành động riêng sửa/xoá/đổi tên — CV, sheet, view) → DOCUMENT TABS (underline, `TabsCard`), KHÔNG chip strip.** Ref: NN/g Tabs Used Right (tabs = alternate views cùng context) + Google Docs/Sheets document tabs. **Phân ranh với attempt-selector** ([[attempt-history-selector…]] = chip strip): attempt = bản ghi TRANSIENT chỉ-xem của 1 bài → chip; document = ít, bền, có identity + action → tab. Hỏi: item này có tên riêng + user quản lý (sửa/xoá) không? Có → document tab; chỉ là lịch sử xem lại → chip.
- **2 trục cùng govern body → GỘP 1 toolbar `TabsCard`:** trái = trục NỘI DUNG (document nào — accent) · phải = trục TRÌNH BÀY (Kết quả/Xem trước — `rightTabsNeutral`, 1 tín hiệu accent/toolbar). KHÔNG 2 hàng tab chồng ([[leaf-page-one-nav-and-combined-tab-toolbar]]).
- **Hành động per-document (⌄ Sửa/Xoá) + "+" thêm mới = slot `leftEnd` của `TabsCard`** — cụm inline render NGAY SAU dải tab trái, là **SIBLING của tab list, TUYỆT ĐỐI KHÔNG lồng button vào `Tabs.Tab`** (react-aria tab không nest interactive — cùng gotcha `CvHistoryItemMenu`/`FlexWrapButtonRadio`). ⌄ menu áp cho document ĐANG ACTIVE (Google Sheets style — 1 menu thay N kebab luôn-hiện); "+" = ghost icon-only thêm document; "+N" overflow = span muted (TODO drawer).
- **Tab label = 1 node trong `label`, KHÔNG dùng prop `icon`** khi icon là verdict/status: `TabsCard` ẩn label dưới `sm` khi có `icon` (icon-only mobile) → N tab cùng icon verdict thành N icon giống hệt, không phân biệt. Nhét verdict + tên (truncate `max-w-32`) + score nhỏ (`text-xs opacity-70`) hết vào `label`.
- **Header row của collection:** label trái + **outcome line** (recruiter-unlock) phải; entry-point "+ Thêm" chỉ về hàng này khi **0 document** (strip dưới không render). ≥1 document → strip tabs render (kể cả 1 — kiểu Sheets: 1 tab + "+").

## ĐÃ ÁP DỤNG 2026-07-05 (FE `D:\Repositories\starci-academy`, branch mtp)
- `TabsCard` thêm prop **`leftEnd?: ReactNode`** (cụm sau dải trái, bọc `flex min-w-0 items-center gap-1`).
- `CvWorkspace` review-mode: 4 hàng → 2 (header row + 1 toolbar); bỏ `FlexWrapButtonRadio` dial + hàng recruiter riêng; ⌄ = `CvHistoryItemMenu` cho active CV; "+" vào toolbar; 0 CV giữ nút "+ Thêm CV mới" ở header + toolbar chỉ còn Kết quả/Xem trước. tsc/eslint sạch.
- **Kèm chưa làm (chờ thầy chốt riêng):** CV chưa xác minh bỏ chip "Chưa đủ điều kiện liên hệ NTD" (thừa với chip "Chưa xác minh · không tính điểm") — ý thầy "không xác minh liên hệ chi".
