# Draft — Section challenges: LabeledCard frameless · icon motif 1 lần ở section · "Thử thách N" = eyebrow CÂM (không Heading/Header) (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (card/list/header) + [[dashboard-labeledcard-and-tabscard]] + [[item-card-meta-inside-bounded-object]].
- Bối cảnh: tab "Thử thách" của lesson reader (`ChallengeBody` + `ChallengeCard`). Thầy lặp vài vòng về dòng "Thử thách N": thử `Typography.Heading` → `<Header>` (HeroUI) → cuối cùng chốt **`text-muted text-xs`** (eyebrow câm). Đồng thời gói section vào LabeledCard.

## Luật (STRICT)
- **Section có tiêu đề mà NỘI DUNG là card(s) → `LabeledCard` `frameless`** (label NGOÀI, KHÔNG bọc thêm `<Card>` → tránh card-in-card). Áp cho section "Thử thách": label = `"{count} thử thách trong học phần này"` (KHÔNG icon — xem đính chính dưới), body = list `ChallengeCard`. Mở rộng [[dashboard-labeledcard-and-tabscard]] ra lesson-reader.
- **ĐÍNH CHÍNH 2026-06-24 (thầy: *"bỏ luôn cái logo challenge"*): label section "Thử thách" KHÔNG icon.** Trước đó từng để `PuzzlePieceIcon` ở label (ý "icon motif 1 lần ở section"); thầy chốt bỏ hẳn → label section chỉ là chữ count, KHÔNG `icon` prop. Nguyên tắc rút lại: **eyebrow/label đếm số (count) là chữ câm, mặc định KHÔNG icon**; chỉ thêm icon khi thầy duyệt riêng. Đừng tự gắn icon motif cho label section.
- **Icon motif KHÔNG lặp ở từng item.** Mỗi `ChallengeCard` cũng KHÔNG có icon. Kết quả: cả section lẫn item đều không icon puzzle (sạch).
- **Dòng định danh số thứ tự của item ("Thử thách N", "Bước N"…) = EYEBROW CÂM `text-xs text-muted`, KHÔNG nâng thành heading.** Thầy chốt (2026-06-24, sau khi thử cả `Typography.Heading level={4}` lẫn HeroUI `<Header>`): *"bỏ `<Header>`, dùng `text-muted text-xs` đi"*. Lý do: **TITLE của item mới là dòng có nghĩa cần đọc**; số thứ tự chỉ là nhãn phụ low-key → giữ nhỏ + mờ, đừng làm nó to/đậm hơn title (đảo cấp). Đừng over-engineer eyebrow thành `<h*>`/component header.
- **Nguyên tắc rút ra:** không phải mọi "nhãn" đều phải là heading semantic. Nhãn **phụ/định danh phụ** (số thứ tự, meta) để eyebrow câm; chỉ phần **mang nội dung chính** (title) mới là dòng nổi. Chọn primitive theo VAI TRÒ THỊ GIÁC thầy muốn, không máy móc "nhãn → Heading".

## ĐÃ ÁP DỤNG 2026-06-24
- `ChallengeBody/index.tsx`: bọc list trong `LabeledCard frameless` (label = count, icon puzzle). `ChallengeCard/index.tsx`: "Thử thách N" = `<span className="text-xs text-muted">…</span>` (không icon, không Heading/Header); gỡ import `PuzzlePieceIcon` + `Typography`/`Header`. tsc/lint sạch. Title giữ `<div font-medium>`.
