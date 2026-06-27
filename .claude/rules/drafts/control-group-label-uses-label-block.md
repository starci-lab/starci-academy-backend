# Draft — Nhãn của 1 NHÓM control/option (mode picker, level selector, field group) = block `<Label>`, KHÔNG `text-sm text-muted` tay (2026-06-27)

- File/§ đích khi `/merge`: `elements/label.md` §1 (đã thêm) + liên quan [[challenge-section-labeledcard-quiet-eyebrow-icon-once]] (phân biệt eyebrow câm) + [[single-select-among-options-use-tabs]] (control chọn 1-trong-N).
- Bối cảnh: redesign trang Phỏng vấn thử (Readiness Hub, hướng A). Nhãn "Kiểu luyện" (mode picker) + "Cấp độ" (level segmented) đang dựng bằng `<div className="text-sm text-muted">`/`text-xs text-muted` tay. Thầy: *"kiểu luyện cấp độ dùng Label nhé, không dùng text-sm text-muted"*.

## Luật (STRICT)
- **Nhãn giới thiệu 1 NHÓM control/option (mode picker, level/segmented selector, field group, radio/checkbox group, 1 cụm input) = block `<Label>` (HeroUI), KHÔNG `text-sm text-muted`/`text-xs text-muted` dựng tay.** `<Label>` là primitive nhãn-điều-khiển chuẩn của hệ (đồng bộ cỡ/màu/spacing với mọi field), wire `htmlFor`/aria cho control → a11y đúng. Text muted tay = lệch da + mất liên kết nhãn↔control.
- **Phân biệt rõ 2 loại "nhãn" (đừng nhầm):**
  - **Nhãn nhóm control / field label** ("Kiểu luyện", "Cấp độ", "Question level", "Ngôn ngữ") → **`<Label>`**. Đây là nhãn của thứ user TƯƠNG TÁC bên dưới.
  - **Eyebrow / count / meta câm** (số thứ tự "Thử thách N", "n mục", caption phụ) → `text-xs text-muted` (quiet, ref [[challenge-section-labeledcard-quiet-eyebrow-icon-once]]). Đây là nhãn ĐỊNH DANH/đếm phụ, không gắn control.
  - → Hỏi: nhãn này đứng TRÊN 1 control/group user bấm-chọn? → `<Label>`. Chỉ là text định danh/đếm phụ? → muted câm.
- **Section label của 1 CARD/khối** vẫn theo `LabeledCard` (label ngoài) — [[elements/label]] §1. Luật này bổ sung cho **nhãn-nhóm-control BÊN TRONG 1 surface** (setup card, form), nơi không bọc LabeledCard riêng cho từng nhóm.

## Áp đầu (2026-06-27)
- `InterviewSession` setup (Readiness Hub): nhãn "Kiểu luyện" + "Cấp độ" → `<Label>` (thay `text-sm/xs text-muted`). Apply qua `/starci-fe-ux-apply`.
