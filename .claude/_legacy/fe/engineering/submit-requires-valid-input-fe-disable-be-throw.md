# Concept — Input BẮT BUỘC: FE DISABLE nút khi rỗng/invalid + BE mutation THROW (defense in depth)

> Heuristic (họ `concepts/*`, validation). Rút từ panel "Nộp bài" challenge — input URL rỗng vẫn bấm "Nộp bài" được.

## Luật (STRICT)
- **Nút submit/grade/save phụ thuộc 1 input BẮT BUỘC → `isDisabled` khi input rỗng/invalid** (per-row nếu nhiều row). Đừng chỉ hiện FieldError mà vẫn cho bấm. Gate bằng cờ lỗi đã tính (`errorMessage`/`validateX`), không cần touch trước.
- **Defense in depth — 2 lớp:** (1) FE disable nút + guard trong handler (empty-check → return, không gọi mutation); (2) BE mutation **throw** khi rỗng/invalid (vd `SubmissionUrlInvalidException`). KHÔNG dựa 1 lớp.
- **Save/auto-save 1 field cũng validate TRƯỚC khi persist** — đừng ghi giá trị rỗng/rác vào DB. Auto-save chỉ lưu khi field hợp lệ (per-field — cùng họ auto-save per-row [[disable-vs-lock-and-perrow-autosave]]).
- **Nguyên tắc:** input bắt buộc mà rỗng = "chưa hợp lệ" → mọi hành động phụ thuộc (submit/grade/persist) chặn ở CẢ FE (affordance) LẪN BE (nguồn sự thật).

## Liên quan
- [[disable-vs-lock-and-perrow-autosave]] (auto-save per-row + disable vs lock icon) · [[heroui-textfield-helper-error-needs-slot]] (FieldError).
