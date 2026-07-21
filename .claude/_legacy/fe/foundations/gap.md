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

## Divider trong card/stack = gap-3 hai bên (CHỐT 2026-06-30)
- **Khi 2 block ngăn nhau bằng DIVIDER (`border-t`) trong 1 card/stack → khoảng trên-dưới divider = `gap-3` (12px), KHÔNG `gap-6`.** Divider đã gánh việc phân tách; cộng thêm gap-6 (24px) mỗi bên = "xa lắm" (thầy). Divider + `gap-3` = vừa đủ.
- Impl đối xứng: block-trên + block-dưới(`border-t pt-3`) là 2 con của container `flex flex-col gap-3` → trên divider = gap-3 (container), dưới = `pt-3` → 12px mỗi bên. Nội bộ mỗi block giữ nhịp riêng (vd cụm control vẫn `gap-6`); chỉ vùng QUANH divider mới gap-3.
- Cùng tinh thần [[whitespace-over-dividers]]: ưu tiên whitespace; nếu DÙNG divider thì đừng kèm gap lớn (thừa phân tách).

## Course-home / stack dọc — 2 vùng: gap-6 CHIA, gap-3 TRONG (course-home-vertical-rhythm)
- **`gap-6` chỉ dùng để CHIA 2 vùng KHÁC chức năng; mọi phần tử CÙNG 1 vùng = `gap-3`.** Đừng rải `gap-6` đều cho mọi khối xếp dọc (thưa), cũng đừng ép tất cả về `gap-3` (mất ranh giới vùng). Gom thành cụm `gap-3` rồi để `gap-6` ở đúng 1 đường chia.
  - Vd course-home: **Vùng A** (định danh + hành động: breadcrumb · title · continue+progress) `gap-3` trong; **Vùng B** (duyệt nội dung: search · cây index) `gap-3` trong; giữa A↔B = `gap-6`.
- **Khối "Tiếp tục học + tiến độ" để PHẲNG, KHÔNG bọc `Card`.** Nó là hành động chính + meter đặt thẳng trên nền trang (flat); bọc card = "hộp trong hộp" thừa (ref [[card]] "card chỉ cho bounded object", design restraint).
- Skeleton mirror cùng cấu trúc/nhịp (gap-6 chia, gap-3 trong) → không nhảy layout.
- ⚠️ **Đính chính khi dùng `PageHeader`:** khi trang dùng block `PageHeader`, header tách hẳn (header → content = `gap-10`, ngoại lệ có tên); continue/progress là CONTENT (trong cluster `gap-6`). Xem [[elements/header]] §2.

## Scroll
- Khi scroll, **phần header trên (vùng "đỏ": breadcrumb + title + desc + chips) GIỮ NGUYÊN gap** — không bị nén/đổi nhịp. Nội dung dưới cuộn, header giữ rhythm. (Liên quan [[sticky]].)

## Quy tắc rút ra
- Mỗi cặp phần tử chọn 1 nấc theo QUAN HỆ: dính(0) · cụm con(2) · trong khối(3) · giữa khối(6) · giữa vùng rộng(8) · header→content(10).
- Padding card vẫn `px-4 py-3` (block sở hữu). Đừng rải gap-6 đều mọi nơi (thưa) hay ép tất cả gap-3 (mất ranh giới vùng).
- ⚠️ NỢ: vài chỗ đang `gap-4` (pricing card interior) — ngoài thang mới; cân nhắc nắn về 3/6 (xem debts).
