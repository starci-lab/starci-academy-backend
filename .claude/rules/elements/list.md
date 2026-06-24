# Element — List

> Element doc cho họ "list" (blocks/lists). Chọn block theo bản chất item + ngữ cảnh. Chi tiết quyết định ở `drafts/*` cho tới khi `/merge`.

## Các block list (đã chốt)

### 1. `ListRow` — 1 hàng nhãn ngắn (truncate + trailing meta)
- Row nhãn 1 dòng, GitHub-style: title `truncate` + meta/trailing phải. Item title NGẮN. KHÔNG cho đoạn markdown dài (sẽ cắt cụt). Ref [[outcome-list-as-labeledcard-check-list]] (phân vai ListRow vs row tự dựng).

### 2. `PaginatedList` — list có phân trang
- List + pager. Pager căn TRÁI thẳng mép content, có hover/cursor. Ref [[list-pager-left-align-and-hover]].

### 3. ★ `LabeledList` — nhãn + list ngắn (+ CTA), KHÔNG card frame — 2026-06-24
- **Khi 1 khối là "label + danh sách item ngắn (+ 1 action)" mà KHÔNG cần khung card** (rail/panel) → dùng `blocks/lists/LabeledList`, KHÔNG tự dựng `<div>` + `Label` + `Separator` tay.
- **Cấu trúc + nhịp (block sở hữu):** `section flex flex-col gap-3` = 3 nhóm cách `gap-3`:
  1. **Header** = `icon + Label` (`flex items-center gap-2`).
  2. **List** = `flex flex-col gap-2` bọc children (item ↔ item = `gap-2`).
  3. **Action** (optional) = footer CTA (vd `Button self-start`).
- **Props:** `{ label, icon?, children (item rows), action?, className }`. Feature chỉ truyền data + render row + CTA; KHÔNG style.
- **Phân biệt với [[elements/card]] §2 `LabeledCard`:** LabeledCard = label NGOÀI + content trong **`<Card>`** (có khung surface). LabeledList = **KHÔNG khung**, content là 1 **list gap-2** + action — nhẹ hơn, cho rail/panel nơi thêm card sẽ nặng / đụng luật "không 2 card liên tiếp" ([[concepts/card]]).
- **KHÔNG divider giữa header/list/action** — ngăn bằng whitespace `gap-3` (ref [[concepts/whitespace-over-dividers]]). **KHÔNG dòng count thừa** ("N thử thách"/"N thẻ") khi list đã hiện item.
- Áp đầu: rail "Trên trang này" — `LessonChallenges` ("Luyện tập bài này") + `LessonFlashcards` ("Ôn tập bài này").

## Nguyên tắc chọn block
- Item là **đoạn markdown dài** → KHÔNG `ListRow` (truncate) → row tự dựng + `MarkdownContent` ([[description-fields-render-markdown-compact]]).
- Khối "label + list" cần khung card thật → `LabeledCard`; chỉ cần nhẹ (rail) → `LabeledList`.
- Style chỉ ở block; feature ghép data.
