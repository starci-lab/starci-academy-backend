# Concept — Nhãn định-danh-phụ = eyebrow CÂM (`text-xs text-muted`), KHÔNG nâng heading; section-label mặc định KHÔNG icon

> Heuristic (họ `concepts/*`). Rút từ section "Thử thách" (lesson reader): thử `Typography.Heading` → `<Header>` → chốt eyebrow câm. Bổ trợ [[no-uppercase-text]] + [[elements/label]] (nhãn nhóm control) + [[elements/card]] (LabeledCard frameless).

## Quy tắc (STRICT)
- **Dòng định-danh-PHỤ của 1 item (số thứ tự "Thử thách N", "Bước N", meta/đếm) = EYEBROW CÂM `text-xs text-muted`, KHÔNG nâng thành heading (`Typography.Heading`/`<Header>`/`<h*>`).** TITLE của item mới là dòng có nghĩa cần đọc; số thứ tự chỉ là nhãn phụ low-key → giữ nhỏ + mờ, đừng làm nó to/đậm hơn title (đảo cấp). Đừng over-engineer eyebrow thành component header.
- **Không phải mọi "nhãn" đều phải là heading semantic.** Nhãn **phụ/định danh phụ** để eyebrow câm; chỉ phần **mang nội dung chính** (title) mới là dòng nổi. Chọn primitive theo VAI TRÒ THỊ GIÁC thầy muốn, không máy móc "nhãn → Heading".
  - Phân biệt với [[elements/label]] §1b: nhãn đứng TRÊN 1 control user bấm-chọn ("Kiểu luyện"/"Cấp độ") → block `<Label>`; nhãn định-danh/đếm phụ → `text-xs text-muted` câm.
- **Eyebrow/label đếm số (count) mặc định KHÔNG icon.** Chỉ thêm icon khi thầy duyệt riêng — đừng tự gắn icon motif cho label section. (Vd label section "Thử thách" = chữ count thuần, KHÔNG puzzle-icon.)
- **Icon motif KHÔNG lặp ở từng item.** Nếu section-label có icon (khi được duyệt) thì item bên trong KHÔNG lặp lại icon đó.
- KHÔNG uppercase eyebrow (ref [[no-uppercase-text]]).

## Liên quan (bit thuộc element khác)
- **Section có tiêu đề mà nội dung LÀ card(s) → `LabeledCard frameless`** (label ngoài, tránh card-in-card) — thuộc [[elements/card]] §2.
- [[no-uppercase-text]] (eyebrow không hoa) · [[elements/label]] (nhãn nhóm control = `<Label>`; định danh phụ = muted câm).
