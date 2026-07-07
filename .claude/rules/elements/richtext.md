# Element — RichText (MarkdownContent rendering)

> Element doc: field nào render qua `MarkdownContent` (RichText) vs text thô. Tổng quát hoá [[description-fields-render-markdown-compact]] sau scan content (2026-06-25). Chi tiết ở `drafts/*` cho tới `/merge`.

## 1. Luật — MỌI field do người dạy soạn render qua MarkdownContent
- **Bất kỳ field hiển thị nào người dạy/BE soạn có thể chứa markdown (inline-code `` `x` ``, `**bold**`, list…) PHẢI render qua `MarkdownContent`, KHÔNG `<Typography>`/`<span>`/`<div>` text thô.** Text thô làm **lòi cú pháp** (backtick `` `servedBy` `` hiện nguyên `` ` ``).
- **Scan content (2026-06-25) chứng minh inline-code phủ KHẮP field challenge** → tất cả phải RichText:

  | Field | files có inline-code | spans |
  |---|---|---|
  | requirements (title+body) | 2076 | ~128k |
  | steps (title+body) | 2029 | ~95k |
  | description | 2572 | ~82k |
  | prerequisites | 1661 | ~6.7k |
  | outputs | 811 | ~3.7k |
  | **title** (challenge) | 15 | 62 |

- **Bao gồm cả TITLE** (challenge title, requirement title, step title) — KHÔNG chỉ body. Title là chỗ hay sót (FE hay render `<span>{item.title}</span>` thô).

## 2. Hai mode render
- **Block (body, description nhiều dòng):** `<MarkdownContent markdown={x} />` (compact mặc định; `reading` chỉ cho cột đọc lesson). Preview/card cắt dòng → `className="[&_p]:m-0 [&_p]:line-clamp-2"` (clamp `<p>` bên trong, không clamp div ngoài). Ref [[description-fields-render-markdown-compact]].
- **Inline 1 dòng (TITLE trong accordion trigger / heading / row):** MarkdownContent bọc text trong `<p>` block → phá layout title. Dùng arbitrary variant ép inline + bỏ margin:
  `<MarkdownContent markdown={item.title} className="[&_p]:m-0 [&_p]:inline" />` (giữ cỡ/đậm của title qua class wrapper: `text-base font-semibold`). Title vẫn 1 dòng nhưng inline-code render đúng.
- **Guard rỗng:** `x ? <MarkdownContent .../> : null`.

## 3. RichText vs TYPO (phân biệt khi scan)
- **inline-code thật** (định danh/route/pseudo-code: `servedBy`, `/api/metrics`, `qty > tồn`, `if (id) status=404`) → GIỮ, render RichText.
- **TYPO cần sửa content:** backtick **lẻ/unmatched** (số `` ` `` lẻ trong 1 field → vỡ render). Scan 2026-06-25: 2 file (`1-system-design-mastery/.../15-distributed-rate-limiter/.../hierarchical-multi-tenant-quota` vi+en). → sửa data.
- inline-code bọc prose tiếng Việt dài (vd `% tiết kiệm`) = borderline; phần lớn là pseudo-code hợp lệ — chỉ sửa khi rõ là nhãn prose nhầm backtick.

## 4. Spots cần fix (audit ChallengeView 2026-06-25)
- ❌ challenge **title** (`ChallengeView` L219), **requirement title** (L267), **step title** (L308) — đang `<span>` thô → đổi inline MarkdownContent.
- ✅ đã RichText: requirement/step **body**, prerequisites, outputs body, hint.
- **Secondary (scan tiếp khi đụng):** `ChallengeCard` (lesson reader) description, flashcard Q/A, course prereq/value-props — field title/text có markdown → MarkdownContent.

## 5. Lesson render: heading SÂU vẫn ra heading + measure thuộc CỘT ĐỌC (không cap trong renderer)
- **KHÔNG cap measure (line-length) BÊN TRONG `MarkdownContent` bằng `max-w-*`.** `max-w-prose` trên wrapper markdown làm nội dung **căn TRÁI**, chừa khoảng phải = **lệch 1 bên**. **Measure là việc của CỘT ĐỌC** (LessonReader column) — muốn hẹp thì narrow + `mx-auto` chính cột đó (kéo theo code/sandbox), KHÔNG nhét max-width vào renderer.
- **Heading SÂU (h4/h5/h6) trong reading PHẢI đọc ra heading, KHÔNG `text-muted` nhạt.** Lesson StarCi đánh số rất sâu (`2.1.3` = h4, `2.1.3.2` = h5) → h5/h6 là **mục thật**, không phải label phụ. Reading: **foreground + font-semibold + `mt-4`**; muted/nhỏ chỉ cho **compact** (card/chat/flashcard). Thang vẫn giảm cỡ (h4 base → h5/h6 sm) nhưng **không mờ**.
- **Nguyên tắc:** mỗi quyết định ở đúng tầng — *cỡ/đậm/màu chữ* = renderer (`map.tsx`); *bề rộng cột đọc / căn giữa* = layout cột (LessonReader). Trộn → lệch mép hoặc heading "mất chức".

## Liên quan
- [[description-fields-render-markdown-compact]] (block compact + clamp) · [[outcome-list-as-labeledcard-check-list]] (outputs row + MarkdownContent) · [[elements/accordion]] (title trong accordion trigger) · [[lesson-render-deep-headings-and-measure]] (heading sâu + measure).
