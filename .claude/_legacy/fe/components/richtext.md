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

## 6. Đoạn `**bold**` ĐỨNG MỘT MÌNH (sole child của `<p>`) = LABEL, không phải câu nhấn mạnh — CHỐT 2026-07-09
- **Content tác giả hay dùng `**Label**` làm "heading giả"** (vd flashcard answer: "**Trả lời thẳng** ...", "**Vì sao** ...", "**Cạm bẫy** ..." — mỗi label MỞ ĐẦU 1 đoạn riêng, KHÔNG lẫn giữa câu). Render mặc định `strong: font-semibold` làm nó ra chữ đen đậm to, LẠC so với các label UI xung quanh (vd "Đáp án" ở `body-xs muted`) — thầy chỉ: *"trả lời thẳng render dạng text-sm text-muted cho đồng bộ với trên"*.
- **Fix ở `MarkdownContent/map.tsx`'s `p` override, KHÔNG sửa `strong` global** (tránh đổi luôn bold-giữa-câu ở mọi nơi khác — blast radius quá rộng, `MarkdownContent` dùng chung toàn app). Check qua AST `node.children`: `<p>` mà **CHỈ CÓ 1 con** và con đó là `tagName === "strong"` → render `<div className="text-sm text-muted">{children}</div>` thay vì `ProseText` thường. Bold LẪN trong câu (nhiều node con, hoặc `strong` không phải sole child) → giữ nguyên `font-semibold` đen như cũ, không đổi.
- Ref: `strong`/`p` component map trong `MarkdownContent/map.tsx`. Áp đầu: flashcard quiz/review answer markdown ("Trả lời thẳng"/"Vì sao" section labels).

- **Arc-section (đáp án flashcard/mock-interview `arcSections`) — nhãn = `text-xs text-muted`, KHÔNG tô màu theo vai trò (CHỐT 2026-07-12).** `ArcSection` trong `map.tsx`: mỗi section = rule trái `border-l-2 border-default` (neutral) + nhãn eyebrow `[&>*:first-child]:!text-muted !text-xs !font-medium`. **Đính chính:** bản trước (cùng ngày) thử map nhãn→màu-vai-trò (Chốt=success/Trade-off=warning/Bẫy=danger) — nhưng render LỆCH vì nhãn content KHÔNG chuẩn (lúc "Trả lời thẳng" lúc "Chốt" lúc "Giải pháp"/EN-drift), màu ra chỗ có chỗ không → thầy: *"màu bị sai này, sau muted hết thế"*. Bài học: **đừng phụ thuộc màu vào nhãn content tự do**; thống nhất CONTENT trước (đã normalize nhãn về bộ canonical §2), render nhãn muted đồng nhất. `ARC_ROLE`/`arcRoleFor` đã gỡ.

## Liên quan
- [[description-fields-render-markdown-compact]] (block compact + clamp) · [[outcome-list-as-labeledcard-check-list]] (outputs row + MarkdownContent) · [[elements/accordion]] (title trong accordion trigger) · [[lesson-render-deep-headings-and-measure]] (heading sâu + measure).
