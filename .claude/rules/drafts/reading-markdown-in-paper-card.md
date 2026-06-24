# Draft — Nội dung ĐỌC dạng markdown (bài viết) render TRONG "paper" Card như ContentBody, KHÔNG phẳng trên canvas (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (reading surface) hoặc `elements/card.md` + liên quan
  [[description-fields-render-markdown-compact]] (compact ≠ reading).
- Bối cảnh: trang Foundation resource ("Lộ trình học Docker", `FoundationResourceBody` kind=Document) render
  `MarkdownContent` **phẳng** thẳng trên nền trang. Thầy: *"cái markdown này buộc phải render trong card, theo như content body"*.

## Luật (STRICT)
- **Bài đọc markdown (full article / reading content) PHẢI nằm trong 1 `<Card><CardContent>` ("paper")**, KHÔNG để
  `MarkdownContent` trần trên `bg-background`. Đây là pattern của lesson reader **`ContentBody`**: `LessonReader` bọc
  `bodyComponent` trong `<Card><CardContent><div id="lesson-article">…</div></CardContent></Card>`. Card = "tờ giấy"
  cho khu đọc; nền trang là bàn, bài đọc là tờ giấy đặt trên.
- **Áp cho mọi surface "đọc 1 bài":** lesson content, **foundation resource (Document)**, và các trang bài-viết
  tương tự. Markdown là NỘI DUNG đọc → luôn có card-surface bao quanh.
- **Phân biệt với markdown COMPACT** ([[description-fields-render-markdown-compact]]): mô tả ngắn trong card/list/
  panel (challenge desc, outputs…) render compact, KHÔNG cần thêm card riêng (đã ở trong card cha). Luật này chỉ cho
  **bài đọc đứng một mình** (reading column) — cái đó phải có paper card của riêng nó.
- **Ngoại lệ trong cùng renderer:** video (`VideoRenderer` đã có khung bo riêng) + external-link (nút) KHÔNG cần
  paper card — chỉ **Document/markdown article** mới bọc Card.

## ĐÃ ÁP DỤNG 2026-06-25
- `Foundations/FoundationResourceBody` case `FoundationKind.Document`: bọc `MarkdownContent` trong
  `<Card><CardContent>` (named `Card, CardContent` từ `@heroui/react`, khớp `LessonReader`). Video/ExternalLink giữ nguyên.
  tsc/lint sạch.
