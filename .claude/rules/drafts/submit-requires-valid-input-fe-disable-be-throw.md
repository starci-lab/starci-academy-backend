# Draft — Nút submit/save bắt buộc: FE DISABLE khi input rỗng/invalid + BE mutation THROW (defense in depth) (2026-06-25)

- File/§ đích khi `/merge`: `concepts/*` (validation) + `main.md` §7 (form/async).
- Bối cảnh: panel "Nộp bài" challenge — input URL rỗng vẫn bấm "Nộp bài" được. Thầy: *"validate kĩ, không có input thì không cho submit. scan toàn bộ FE BE chỗ nào cần validation"*.

## Luật (STRICT)
- **Nút submit/grade/save phụ thuộc 1 input BẮT BUỘC → `isDisabled` khi input đó rỗng/invalid** (per-row nếu nhiều row). Đừng chỉ hiện FieldError mà vẫn cho bấm. Gate bằng cờ lỗi đã tính (`errorMessage`/`validateX`), không cần touch trước.
- **Defense in depth — 2 lớp:** (1) FE disable nút + guard trong handler (empty-check → return, không gọi mutation); (2) BE mutation **throw** khi input rỗng/invalid (vd `SubmissionUrlInvalidException`). KHÔNG dựa 1 lớp.
- **Save/auto-save 1 field cũng phải validate trước khi persist** — đừng ghi giá trị rỗng/rác vào DB. Auto-save chỉ lưu khi field hợp lệ (per-field), giống auto-save per-row của challenge URL ([[disable-vs-lock-and-perrow-autosave]]).
- **Nguyên tắc:** input bắt buộc mà rỗng = trạng thái "chưa hợp lệ" → mọi hành động phụ thuộc nó (submit/grade/persist) phải bị chặn ở CẢ FE (affordance) lẫn BE (nguồn sự thật).

## ĐÃ ÁP DỤNG 2026-06-25
- Challenge: `SubmissionRow` nút "Nộp bài" `isDisabled={Boolean(errorMessage) || isInputDisabled}` + `onSubmit` guard empty→return. BE submit đã throw khi rỗng. tsc/lint sạch.

## GAP còn lại (scan FE+BE, chờ duyệt)
- **BE `submit-personal-github-url`**: `validation-hits=0` — set `personalProjectGithubUrl = request.githubUrl` không validate (rỗng/format). `review-personal-project-task` validate lúc chấm nên grading vẫn chặn, nhưng vẫn nên validate ở submit để không lưu URL rác.
- **FE personal-project repo URL**: auto-save (PersonalProjectSubmission) cần gate per-field valid trước khi persist.
- Soi tiếp: `ByokForm` (API key), `EditProfile` (links) — xác nhận có gate submit khi rỗng/invalid.
