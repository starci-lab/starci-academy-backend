# Draft — Tách 1 card "cấu hình/setup" dài thành các LabeledCard: GỘP THEO NGHĨA (what vs how), KHÔNG per-control; CTA đơn để PHẲNG; meta-intro = strip phẳng dưới header (2026-06-30)

- File/§ đích khi `/merge`: `concepts/card` / `elements/card.md` + liên quan [[concepts/card]] (không 2 box dính; card phải xứng bounded object) · [[control-group-label-uses-label-block]] (nhãn nhóm control = `<Label>`) · [[primary-cta-icon-size-lg]] · [[whitespace-over-dividers]].
- Bối cảnh: trang Phỏng vấn thử (`InterviewSession` setup). Vòng 5 gộp mọi cấu hình (Kiểu luyện + Cấp độ + Model chấm + CTA + chips) vào 1 `LabeledCard` "Bắt đầu" → thầy: *"tách layout thằng này ra thành các labeled card"*. Vòng 6 tách.

## Quy tắc (STRICT)
- **Khi tách 1 card "cấu hình/setup" dài thành nhiều LabeledCard → GỘP CONTROL THEO NGHĨA, mỗi card = 1 nhóm có nghĩa rõ; KHÔNG tách per-control.** Hỏi: các control này trả lời câu hỏi GÌ? Gom theo trục ý nghĩa (vd *what to practice* = Kiểu luyện + Cấp độ → 1 card "Cấu hình phiên"; *how it's graded* = Model chấm → 1 card "Chấm điểm"). KHÔNG để mỗi control lẻ (1 segmented "Cấp độ", 1 dropdown "Model") thành 1 LabeledCard riêng → card MỎNG/thừa, vi phạm "[[concepts/card]]: card chỉ cho thứ XỨNG là bounded object; 1 control/hành động đơn KHÔNG phải card". Nhiều LabeledCard ngang hàng (mỗi cái nhãn riêng, `gap-6`) là HỢP LỆ — miễn mỗi card là 1 NHÓM có nghĩa, không phải 1 control trần.
- **Control lẻ buộc đứng riêng card (vd "Chấm điểm" chỉ 1 dropdown) → thêm 1 dòng helper `body-xs muted`** giải thích, cho card có "thân" (đỡ trơ 1 control). Đừng để card chỉ chứa đúng 1 control không context.
- **CTA chính ĐƠN (vd "Bắt đầu") để PHẲNG ngoài card** (sau các card cấu hình), KHÔNG bọc thành 1 card riêng (1 hành động đơn ≠ card — [[concepts/card]]). Vẫn `primary` + `size="lg"` + icon ([[primary-cta-icon-size-lg]]).
- **Meta "trò này là gì / kỳ vọng" (subtitle 1 dòng + chips "5 câu · giọng nói · AI chấm") = STRIP PHẲNG dưới header trang, KHÔNG bọc card.** Nó là caption giới thiệu, không phải 1 nhóm control → để phẳng ở đầu (sau page header), trước các card cấu hình. Bọc card cho meta = thừa hộp.
- **Đừng lặp tiêu đề:** nếu page header đã frame ("Ôn tập" + mô tả), bỏ headline trùng ("Sẵn sàng phỏng vấn?") khỏi card-label — để label card nói đúng CHỨC NĂNG card ("Cấu hình phiên" / "Chấm điểm"), không lặp tên trang.

## Quyết định nhanh
- Có ≥2 control? → gom theo trục nghĩa thành 1-2 card "có nghĩa" (what / how / who…), KHÔNG mỗi control 1 card.
- 1 card chỉ còn 1 control? → thêm helper, hoặc cân nhắc gộp vào card nghĩa gần nhất.
- CTA đơn / 1 dòng meta? → phẳng, không card.

## Bổ sung 2026-06-30 — đồng nhất control trong 1 card + bỏ placeholder "Sắp có" khi thành pill
- **Trong 1 card cấu hình, ưu tiên ĐỒNG NHẤT 1 kiểu control** cho các picker cùng vai (vd Kiểu luyện + Cấp độ đều `FlexWrapButtonRadio insideCard`) → đọc gọn, nhất quán hơn trộn (card-grid + segmented). `insideCard` = nút native (selected `primary`, còn lại `tertiary`), hợp khi đã nằm trong card. (Ngoại lệ ngữ nghĩa: control là **thang ordinal** — vd cấp độ Junior→Staff — `SegmentedControl` track-liền đọc ra "thang" tốt hơn; cân nhắc khi đồng-nhất không quan trọng bằng truyền-tải-thang.)
- **Khi đổi từ card-grid (có badge "Sắp có") sang dải PILL → BỎ luôn mục disabled "Sắp có"**, đừng để nút-ma mờ trong dải pill (disabled card-grid còn đọc được "tính năng sắp tới"; disabled pill trong 1 dải = rối, kém sạch). Re-add khi tính năng ship. (Clutter "disabled options waste space" — bỏ thay vì bày.)

## Bổ sung 2026-06-30 (b) — DIVIDER trong card: gap-3 hai bên, KHÔNG gap-6
- **Khi 2 block trong 1 card ngăn nhau bằng DIVIDER (`border-t`), khoảng cách trên-dưới divider = `gap-3` (12px), KHÔNG `gap-6`.** Divider đã gánh việc phân tách → cộng thêm gap-6 (24px) mỗi bên = "xa lắm" (thầy 2026-06-30). Divider + gap-3 = vừa đủ; divider làm nhiệm vụ chia, gap giữ tight.
- Impl: block trên + block-dưới(`border-t pt-3`) là 2 con của container `flex flex-col gap-3` → trên divider = gap-3 (container gap), dưới = `pt-3` → đối xứng 12px. (Nội bộ mỗi block vẫn theo nhịp riêng — vd cụm config bên dưới giữ `gap-6` giữa các nhóm control; chỉ vùng QUANH divider mới gap-3.)
- Cùng họ [[whitespace-over-dividers]] (divider chỉ khi cần; nếu dùng thì đừng kèm gap lớn → thừa).

## Áp đầu (2026-06-30)
- `InterviewSession` setup: meta strip phẳng (subtitle + chips) → "Cấu hình phiên" (Kiểu luyện + Cấp độ) → "Chấm điểm" (Model + helper) → CTA `lg` phẳng → Lịch sử. Bỏ headline "Sẵn sàng phỏng vấn?" trùng page header. Ref doc `Flashcards/InterviewSession/UX-BRAINSTORM.md` (vòng 6).