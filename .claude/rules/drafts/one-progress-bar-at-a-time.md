# Draft — Tiến độ: 1 thanh tại 1 thời điểm, group gập dùng count (2026-06-19)

- File/§ đích khi `/merge`: `starci-ui.rules` (progress/list patterns) + `main.md` §14 heuristics.
- Bối cảnh: rail content-map có thanh tiến độ KHÓA ở top + lại 1 thanh per-module → 3-4 thanh chồng = "progress everywhere", chật.

## Luật (STRICT)
- **Đừng lặp thanh progress full-width cho mọi item trong list.** Nhiều thanh cạnh nhau = nhiễu thị giác (lặp visual weight).
  Ref: *minimum visual weight / design restraint* — chỉ tiến độ TỔNG giữ dạng thanh; per-section dùng dạng nhẹ.
- **Pattern chốt (thầy duyệt qua widget):** trong list group gập/mở (accordion):
  - **Group ĐANG MỞ** → hiện thanh progress (1 thanh, đúng chỗ user đang quan tâm).
  - **Group GẬP** → chỉ **"n/m"** muted bên phải header (không thanh).
  → cả màn chỉ 1 thanh per-section tại 1 thời điểm + tiến độ tổng ở top.
- Hệ quả kỹ thuật: accordion phải **controlled** (`expandedKeys`/`onExpandedChange`, react-aria DisclosureGroup) để biết group nào mở.
  Auto-mở group chứa item active; search mở mọi group khớp.
- Cách nhẹ khác (nếu vẫn nặng): ring tròn nhỏ (SVG dash) thay thanh; hoặc bỏ hẳn per-section, chỉ count.
- Ref: [uxpin progress trackers](https://www.uxpin.com/studio/blog/design-progress-trackers/) · [pageflows progress UX](https://pageflows.com/resources/progress-bar-ux/) · whitespace>dividers (design restraint).
