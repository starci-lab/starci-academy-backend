# PRINCIPLE — Sequential steps render as accordion

> **Chốt 2026-07-10.** Áp dụng **từ giờ trở đi** (content mới qua `/starci-module-generate`,
> `/starci-milestone-generate`, `/starci-interview-generate` khi có `# followUps`/hướng dẫn
> nhiều bước). **KHÔNG retroactive** — content cũ (82 module hiện có, 3 khóa) giữ nguyên,
> chỉ sửa khi module đó được audit/generate lại và chạm tới đúng block đó.

## Rule

Bất kỳ block nào trong content trình bày **các bước làm tuần tự** (setup, thực hành,
hướng dẫn từng bước) — bắt buộc dùng directive `::::accordion` + `:::panel{title=...}`
mỗi bước 1 panel, **KHÔNG** dùng numbered-list/bullet trần cho chuỗi bước.

```
::::accordion
:::panel{title="Bước 1: ..."}
<nội dung bước 1 — có thể chứa code fence>
:::
:::panel{title="Bước 2: ..."}
<nội dung bước 2>
:::
::::
```

## Áp dụng cho

- **Milestone task** — khối `# criterias` → `body` → `:::muted Các bước` (label) rồi
  `::::accordion` (đã chuẩn hoá qua `starci-milestone-generate`, xem `check-task.mjs §e`).
- **Challenge** — `# steps` field body (walkthrough hướng dẫn hoàn thành challenge) khi
  nội dung là chuỗi thao tác tuần tự, không phải 1 đoạn mô tả đơn.
- **Interview** — `# hints` khi được trình bày dạng hướng dẫn từng bước thay vì list gợi ý
  rời rạc (hiếm, thường hints vẫn là list ngắn — chỉ áp khi thực sự tuần tự).
- **Content (lesson) mới** — bất kỳ section mới thêm vào thân bài trình bày "làm theo các
  bước" (không phải code-walkthrough `##### 2.1.3.x` — đó là template cố định riêng, xem
  §Loại trừ).

## KHÔNG áp dụng (loại trừ)

- **`:::muted` label đơn** (1 nhãn + 1 đoạn văn xuôi, vd flashcard "Chốt"/"Cơ chế", milestone
  "Mục tiêu") — KHÔNG phải chuỗi bước, giữ nguyên `:::muted`, không ép accordion.
- **Code-walkthrough cố định** `##### 2.1.3.1/.2/.3` trong content template (`fullstack/
  contents.md §2.1.3`) — cấu trúc heading số đã fix theo template, không đổi sang accordion.
- **Danh sách không tuần tự** (tags, keywords, rubric items chấm điểm) — vẫn dùng `## N` list
  thường theo DSL field tương ứng, KHÔNG phải accordion (accordion chỉ cho "làm theo thứ tự").

## Verify

`.audits/check-directive-render.mjs <file>` — validate nesting đúng khi ĐÃ dùng accordion
(bắt lỗi panel thiếu title / accordion không có panel con / colon lệch). `check-task.mjs`
bắt riêng cho milestone (accordion cân, panel có title). Script hiện KHÔNG bắt buộc phải CÓ
accordion (chỉ validate khi có) — quyết định "phải dùng accordion ở đây" vẫn là judgement của
agent author/audit theo principle này, chưa có gate tự động ép.

## Liên quan

[[translation-standard-all-content-types]] — principle song song, cùng tinh thần "1 chuẩn áp
mọi loại content", tránh mỗi skill tự định nghĩa lại rule riêng.
