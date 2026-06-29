# Draft — Popover picker (chọn 1-trong-N có search + lựa-chọn-MẶC-ĐỊNH): GHIM default trên cùng (ngoài vùng cuộn) · search NGAY DƯỚI default · chỉ LIST kết quả cuộn ScrollShadow (2026-06-30)

- File/§ đích khi `/merge`: `elements/` (dropdown/picker) hoặc `concepts/` + liên quan [[sticky-rail-overflow-wrap-scrollshadow]] (ScrollShadow vùng cuộn) · [[interactive-needs-hover]] · [[highlight-accent-as-detail-not-block-fill]] (active = accent ở chi tiết).
- Bối cảnh: model picker popover (`GradeModelDropdown` — "Tìm model…", dùng chung chat + grading). Thầy chốt: *"thanh search đặt DƯỚI cái Auto, search ra model dưới chạy scrollshadow"*. Trước đó search ở TRÊN cùng + Auto nằm chung trong list cuộn.

## Quy tắc (STRICT)
- **Popover/dropdown "chọn 1-trong-N" mà có (a) 1 lựa chọn MẶC ĐỊNH/đặc biệt (vd "Tự động/Auto", "Tất cả", "None") + (b) ô search + (c) list dài → bố cục 3 tầng cố định:**
  1. **Default/đặc biệt GHIM TRÊN CÙNG** — đặt NGOÀI vùng search + scroll, luôn thấy, 1 click tới (không bị search lọc mất, không cuộn trôi). Nó KHÔNG phải "1 item trong list" → tách ra.
  2. **Ô search NGAY DƯỚI default** — ngăn bằng divider (`border-t`/`border-b`). Search chỉ lọc LIST kết quả, KHÔNG lọc default.
  3. **List kết quả CUỘN trong `ScrollShadow`** (`hideScrollBar` + `max-h-*`) — fade mép trên/dưới ([[sticky-rail-overflow-wrap-scrollshadow]]). Default + search **đứng yên** (không nằm trong ScrollShadow).
- **Ngăn 3 tầng bằng WHITESPACE `gap-3`, KHÔNG divider** (bọc `flex flex-col gap-3`). Đặc biệt **KHÔNG divider DƯỚI search** → search liền mạch chảy vào list ([[whitespace-over-dividers]]). (Divider trên/dưới search làm "đóng hộp" ô search, ngắt mạch với kết quả.)
- **Search input = `variant="secondary"`** — popover là 1 surface (`bg-surface`/overlay) → input trên surface dùng secondary (`bg-default` xám nổi trên mặt popover), theo [[input-variant-by-surface-and-search-result-count]] / [[elements/input]] §3. HeroUI `SearchField` nhận `variant` (extends `SearchFieldVariants`).
- **Vì sao:** default là hành động hay dùng nhất → phải luôn-thấy, không để search/scroll che. Search là công cụ cho LIST (cái biến thiên) → đặt sát list, trên đầu vùng cuộn. Tách "thứ ghim" khỏi "thứ cuộn" = quét nhanh, không trôi mất lựa chọn chính. (Pattern: command palette giữ action ghim trên; model/emoji picker giữ "recent/auto" cố định.)
- **Đóng popover khi chọn default:** default ghim nằm NGOÀI listbox (react-aria `DropdownMenu`) → KHÔNG tự đóng theo cơ chế menu-select. Phải **controlled `isOpen`** (HeroUI `Dropdown isOpen/onOpenChange`) + nút default `onClick` gọi `onSelect(...)` rồi `setIsOpen(false)`. List item trong `DropdownMenu` vẫn auto-đóng qua `onOpenChange(false)`.
- **`onKeyDownCapture` chặn typeahead:** ô search bọc trong `<div onKeyDownCapture={e => e.stopPropagation()}>` để gõ trong search không kích typeahead/arrow-nav của listbox. KHÔNG đặt handler đó thẳng lên `SearchField` (HeroUI v3 root KHÔNG nhận `onKeyDownCapture` → lỗi type) — bọc `div` thường.
- **Active state của default = accent ở CHI TIẾT** (`text-accent` khi đang chọn Auto, vd `!selection.model`), KHÔNG tô nền cả nút ([[highlight-accent-as-detail-not-block-fill]]).

## Phân biệt
- Áp cho picker có **default đặc biệt + search + list dài**. List NGẮN không search / không có default đặc biệt → không cần tách tầng.
- Khác search-row của 1 LIST surface ([[list-surface-anatomy-search-count-list-pagination]]): cái đó là trang/list, search + count + pager; đây là POPOVER picker nhỏ, trọng tâm là "ghim default + cuộn kết quả".

## Áp đầu (2026-06-30)
- `GradeModelDropdown` (FE `D:\Repositories\starci-academy`): popover `flex flex-col gap-3` → "Tự động" nút ghim trên cùng (ngoài menu, `text-accent` khi active, controlled `isOpen` để tự đóng) · search `variant="secondary"` dưới Auto, **KHÔNG divider** (liền mạch) · `DropdownMenu` model bọc `ScrollShadow max-h-72`. Lọc theo `task` (chatting/grading) vẫn áp trên list. tsc/eslint sạch.
