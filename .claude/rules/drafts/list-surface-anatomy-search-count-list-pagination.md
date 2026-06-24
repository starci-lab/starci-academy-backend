# Draft — Giải phẫu 1 LIST surface chuẩn: search · số lượng records · list · Pagination (2026-06-25)

- File/§ đích khi `/merge`: `elements/list.md` (§ anatomy) + gộp [[input-variant-by-surface-and-search-result-count]] (search+count) + [[list-pager-left-align-and-hover]] (pager).
- Bối cảnh: trang Ôn tập `/learn/flashcards` khối "Bộ thẻ theo chủ đề" (`FlashcardDeckList`). Thầy chốt: *"list phải có search, số lượng records, list và Pagination"*.

## Luật (STRICT) — 1 list "đủ bộ" gồm 4 phần, theo thứ tự
Mọi list duyệt/chọn (deck list, catalog, submissions, results…) — KHÔNG phải list ngắn cố định ≤ vài item — render đủ **4 phần dọc**:
1. **Search** (lọc list) — hàng đầu. Input đặt theo nền ([[input-variant-by-surface-and-search-result-count]]): trên background → KHÔNG variant (`bg-field` trắng); trên card/surface → `variant="secondary"`. Filter client-side (title/desc) hoặc server-side tuỳ data.
2. **Số lượng records** — **bên PHẢI hàng search**, cân bằng layout: `"Tìm thấy {n} <đơn vị>"` (muted `body-sm`, `shrink-0`). `n` = số **đã LỌC** (phản ánh kết quả search, không phải tổng cứng). Hàng search = `flex flex-wrap items-center justify-between gap-3` (input trái `w-full sm:max-w-sm` · count phải).
3. **List** — các item (card/row) `flex flex-col gap-3`. Mỗi item theo bản chất của nó (card thuần + CTA → [[item-card-meta-inside-bounded-object]]; row nav → ListRow…).
4. **Pagination** — **cuối list**, **căn TRÁI** thẳng mép item (`justify-start`), có **hover + cursor** (HeroUI Pagination KHÔNG tự bake → thêm class `cursor-pointer rounded-medium transition-colors hover:bg-default` + active `data-[active=true]:hover:bg-accent`). **Tự ẩn khi `totalPages <= 1`.** Gõ search đổi list → **reset về trang 1** (`useEffect(()=>setPage(1),[query])`). Ref [[list-pager-left-align-and-hover]].

## Quy tắc rút ra
- **Search + count + pager là "khung" của 1 list duyệt được**, không phải option. Count cân bằng nửa phải hàng search (chống trống hoác) + cho biết "lọc ra mấy cái"; pager cho list dài. Thiếu count/pager = list "trần", thiếu định hướng khi nhiều item.
- **Count ở đây CÓ NGHĨA → giữ** (kết quả của search), KHÁC count vanity "N item" đặt DƯỚI list đã liệt kê (cái đó cắt — [[whitespace-over-dividers]]). Count cạnh search = nhãn hành động lọc.
- **Ngoại lệ (KHÔNG cần đủ 4 phần):** list NGẮN cố định/ít item (rail "luyện tập bài này", ≤ vài row) → chỉ cần list (+ label), KHÔNG search/count/pager (thừa). 4-phần áp cho list **duyệt/chọn có thể dài** (catalog, deck topic list, submissions).
- Cân nhắc trích block **`SearchableList`/`PaginatedList`** (đã có `PaginatedList` 4-branch) bọc đủ search-row + count + children + pager để feature chỉ truyền data — giảm lặp 4-phần ở từng feature.

## ĐÃ ÁP DỤNG 2026-06-25 (FE) — FlashcardDeckList
- Search (no variant, trên background) + count "Tìm thấy {n} bộ thẻ" phải + list card thuần (CTA "Học") + `<Pagination>` 8 bộ/trang (căn trái, hover, ẩn khi 1 trang, reset page khi search). tsc/eslint sạch.
- Refs đã có: [[input-variant-by-surface-and-search-result-count]] · [[list-pager-left-align-and-hover]] · [[item-card-meta-inside-bounded-object]] (card thuần + CTA).
