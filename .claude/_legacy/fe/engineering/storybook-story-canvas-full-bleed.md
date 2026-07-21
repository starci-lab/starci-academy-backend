# Concept — Story Storybook = full-bleed canvas, nội dung căn TRÊN-TRÁI

> Heuristic engineering (họ `engineering/*`). Thầy chốt 2026-07-15: *"rules toàn bộ storybook đều có width full height full"* → *"full canvas trên trái nhé"*. Trigger: story `FloatingActionButton` (`position: fixed`) nhìn lạc lõng vì canvas bị co giữa, không đủ khung.

## Quy tắc (STRICT)
- **MỌI story = 1 canvas full-bleed đồng nhất**: full width + full height, nội dung **flow tự nhiên từ trên-trái** (KHÔNG center, KHÔNG shrink-wrap). Không có ngoại lệ per-block — kể cả atom nhỏ (chip/logo/button) cũng nằm trên-trái trong khung full đó.
- **CẤM set `parameters: { layout: ... }` ở story/meta.** Không `"centered"`, không `"padded"`, không `"fullscreen"` per-file. Canvas do **global + global decorator** lo, 1 nguồn.
- **Nguồn sự thật = `.storybook/preview.tsx`:**
  - global `parameters.layout: "fullscreen"` — đây là điều kiện để chiều cao decorator **chạm được iframe thật**. `"centered"` (hay default `"padded"`) bọc story trong hộp co-theo-nội-dung → `h-full`/`min-h-screen` của decorator vô nghĩa (chừa dải xám trên/dưới, block `fixed` như FAB canh sai).
  - global decorator bọc `<div className="… min-h-screen w-full p-8">` — `min-h-screen` (KHÔNG `h-full`: h-full phụ thuộc chiều cao cha, không chắc đầy viewport) + `w-full` + padding chuẩn. Nội dung (Alert "Cách dùng" + `<Story/>`) xếp dọc, top-left.

## Vì sao
- Decorator đã `w-full` + fill sẵn, nhưng `layout: "centered"` của Storybook **flex-center hộp shrink-to-fit** ở NGOÀI decorator → decorator bị co, chiều cao không bao giờ tới iframe. Đổi global sang `fullscreen` mới mở khung thật.
- Đồng nhất > tối ưu từng block: 1 canvas kiểu duy nhất cho cả sách, người duyệt không phải đoán vì sao mỗi story 1 cỡ. Atom nhỏ nằm góc trên-trái là chấp nhận có chủ ý (thầy chốt), đổi lại tính nhất quán.

## Cách làm
- Story mới: **đừng** thêm `parameters.layout`. Cần khung/nền để test tương phản thì tự bọc trong story render (`<div className="bg-… p-6">`), KHÔNG đụng layout param.
- Sweep bỏ override cũ = script regex xoá cả block `parameters: { layout: "x" }` (đơn/đa dòng, sole-key) + dòng `layout:` lẻ; file có comment trong block xử tay (script để lại `parameters: {}` mồ côi).

## Áp đầu (2026-07-15, FE `D:\Repositories\starci-academy`)
- `.storybook/preview.tsx`: global `centered → fullscreen`; decorator `h-full → min-h-screen`.
- Bỏ `layout` override ở **38 story** (`centered` + `padded`) — script sweep + dọn tay `PressableCard` (comment mồ côi). tsc + eslint sạch.
- Ref [[single-source-render]] (canvas 1 nguồn, không fork per-story).
