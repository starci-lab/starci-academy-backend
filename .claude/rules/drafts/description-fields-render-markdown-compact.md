# Draft — Field `description` (do người dạy soạn, có markdown) render bằng MarkdownContent compact, KHÔNG text thô (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (MarkdownContent / text rendering) + `main.md` §1 (grounded-in-data).
- Bối cảnh: trang tab **Thử thách** (lesson reader) — card challenge + panel "Nộp bài" render `challenge.description` /
  `submission.description` bằng `<div>`/`<Typography>` text thô → inline code lòi raw backtick (`` `users` ``,
  `` `GET /users` ``, `201`). Thầy: *"cái này render RichText được không? áp dụng description… tất cả description"*.

## Luật (STRICT)
- **Mọi field do người dạy/BE soạn có thể chứa markdown (description, brief, requirement, hint…) PHẢI render qua
  `MarkdownContent`, KHÔNG `<Typography>`/`<div>` text thô.** Backtick/`**bold**`/list trong nguồn = markdown → text
  thô làm lòi cú pháp. Component có sẵn: `@/components/reuseable` → `<MarkdownContent markdown={…} className=… />`.
- **Default = COMPACT** (prop `reading` để FALSE — mặc định): scale nhỏ cho card/chat/flashcard/modal/panel. Chỉ bật
  `reading` cho bài đọc lesson đầy đủ (cột đọc). Card preview/panel KHÔNG dùng `reading`.
- **Preview cắt dòng (card list) phải clamp `<p>` BÊN TRONG, không clamp div ngoài:** MarkdownContent bọc text trong
  `<p>` → `line-clamp-2` trên wrapper KHÔNG ăn (text nằm trong con). Dùng arbitrary variant
  `className="… [&_p]:m-0 [&_p]:line-clamp-2"` (clamp đúng paragraph + bỏ margin để card gọn). KHÔNG đặt `line-clamp`
  trực tiếp lên div bọc MarkdownContent.
- **Guard rỗng:** `description ? <MarkdownContent …/> : null` — tránh render wrapper rỗng khi field trống.

## ĐÃ ÁP DỤNG 2026-06-24
- `ChallengeCard` (list thử thách): div text thô → `MarkdownContent` compact + `[&_p]:m-0 [&_p]:line-clamp-2`.
- `SubmissionRow` (panel Nộp bài, requirement desc): `Typography` thô → `MarkdownContent` compact. tsc/eslint sạch.
- **Chưa đụng (scope challenge):** các `description` khác (course/deck/foundation/lesson) phần lớn là text thuần →
  chỉ chuyển sang MarkdownContent khi xác nhận field đó thật sự chứa markdown (đừng nhồi markdown cho text thuần).
