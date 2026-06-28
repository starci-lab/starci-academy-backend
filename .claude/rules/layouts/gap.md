# Layout — Gap / nhịp dọc (CHỐT 2026-06-24)

> Thang gap chuẩn cho mọi spacing (gap + padding). Thầy chốt buổi 2026-06-24. Đính chính bản cũ "0/2/3/4/6".

## Thang chuẩn = `0 · 2 · 3 · 6 · 8`
- **`gap-0`** — dính (number ↔ unit, eyebrow ↔ title sát).
- **`gap-2`** (8px) — cụm con sát nhau: title ↔ description, giá ↔ chip giảm, icon ↔ label, chip ↔ chip. **+ item ↔ item trong 1 LIST nén** (row muted ngắn, vd `LabeledList` ở rail — ref [[elements/list]] §3): các item của cùng 1 list = `gap-2`. **+ `<Label>` → 1 INPUT TEXT ngay dưới = `gap-2`** (cặp field sát, da HeroUI — ref [[elements/label]] §1b).
- **`gap-3`** (12px) — trong 1 khối: label ↔ nội dung (label ↔ list ↔ action của `LabeledList`), hàng trong card, khối-con ↔ khối-con cùng cấp. **+ `<Label>` → CARD / RADIO-GROUP / cụm-control** (FlexWrap{Card,Button}Radio, SelectableCardGroup…) = `gap-3` (thoáng khí; KHÁC label→input đơn = gap-2 — ref [[elements/label]] §1b). (Item của list NÉN thì `gap-2` như trên; `gap-3` cho khối/hàng lớn hơn.)
- **`gap-6`** (24px) — giữa 2 khối / 2 vùng khác chức năng (section ↔ section, grid trái ↔ phải). **CHỈ cho cụm component BỰ** (section lớn, vùng layout). Nhiều component NHỎ xếp dọc (vd trong 1 modal: summary · list cổng · link · trust) → vẫn **`gap-3`**, KHÔNG gap-6 (thầy chốt 2026-06-24: "3 component nhỏ thì coi như gap-3"). Quy tắc: gap-6 theo ĐỘ LỚN của khối, không chỉ theo "khác chức năng".
- **`gap-8`** (32px) — phân tách vùng rộng hơn khi cần (nhịp lớn giữa cụm).
- **CẤM** các giá trị ngoài thang (1 / 1.5 / 5 / 7 / 9 / 10…) **trừ ngoại lệ có tên dưới**.

## Ngoại lệ có tên
- **PageHeader → nội dung dưới = `gap-10`** (40px, APP). Khoảng thở LỚN ngay dưới header (breadcrumb/title/desc/chips) trước khi vào nội dung trang. Chỉ dùng đúng chỗ này trong app.
- **LANDING/marketing — section header (`SectionHeading`) → nội dung dưới = `gap-16`** (64px). Thầy chốt 2026-06-26: *"gap-16 giữa header và nội dung dưới thôi, gap-24 dài quá"* (đính chính bản đầu ghi gap-24 — quá xa). MỖI section landing có `SectionHeading` (eyebrow+title+intro) cách khối nội dung bên dưới `gap-16` (thở kiểu landing — KHÁC app `gap-10`). Section có **nhiều khối** nội dung → bọc content trong `<div className="flex flex-col gap-6">` để header→content = `gap-16` còn nội bộ content giữ `gap-6`. Áp: courses · treasure · founder · faq · LearnLoop (pinned + static). Đây là header→content TRONG 1 section; section↔section landing dùng gap lớn hơn (ref [[landing-marketing-section-spacing-and-editorial-stats]]).

## Scroll
- Khi scroll, **phần header trên (vùng "đỏ": breadcrumb + title + desc + chips) GIỮ NGUYÊN gap** — không bị nén/đổi nhịp. Nội dung dưới cuộn, header giữ rhythm. (Liên quan [[sticky]].)

## Quy tắc rút ra
- Mỗi cặp phần tử chọn 1 nấc theo QUAN HỆ: dính(0) · cụm con(2) · trong khối(3) · giữa khối(6) · giữa vùng rộng(8) · header→content(10).
- Padding card vẫn `px-4 py-3` (block sở hữu). Đừng rải gap-6 đều mọi nơi (thưa) hay ép tất cả gap-3 (mất ranh giới vùng).
- ⚠️ NỢ: vài chỗ đang `gap-4` (pricing card interior) — ngoài thang mới; cân nhắc nắn về 3/6 (xem debts).
