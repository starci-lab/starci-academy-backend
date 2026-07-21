# Pattern — Form flow (RHF: validate → disable-on-invalid → submit → success-state)

> Shell/route: `useSubmitJobPostingForm` (`src/hooks/rhf/useSubmitJobPostingForm.ts`) + `JobPostForm`; các hook RHF cùng họ ở `src/hooks/rhf/*` (`useEditProfileForm`, `useContactForm`, `usePinExternalProjectForm`, `useEditSubmissionForm`…).

## Khi nào dùng
- BẤT KỲ form nhập liệu multi-field (không phải 1 input đơn auto-save). Form 1-field auto-save per-row (vd URL nộp bài, lưu ngay khi hợp lệ, không có nút Submit) là case KHÁC — xem `disable-vs-lock-and-perrow-autosave` (principles).

## Vòng đời
1. **Hook RHF riêng per-form** (`src/hooks/rhf/use<Form>.ts`) — trả `watch`/`setValue`/`formState`/`onSubmit`; feature CHỈ đọc qua hook, KHÔNG tự quản `useState` song song field (2 nguồn sự thật cho cùng 1 giá trị).
2. **Section theo NGHĨA** — nhóm field vào `LabeledCard` theo Ý NGHĨA (company/position/apply-method), KHÔNG 1 card/field lẻ — ref card component §6.
3. **Validate + disable** — nút submit `isDisabled` khi field bắt buộc rỗng/invalid; KHÔNG chỉ hiện lỗi mà vẫn cho bấm được. 2 lớp: FE disable (đây) + BE throw khi thiếu — ref `submit-requires-valid-input-fe-disable-be-throw` (engineering).
4. **`isSubmitting`** từ `formState` → nút submit `isPending`, chặn double-submit.
5. **Success = THAY LAYOUT, không toast** — khi form LÀ 1 TRANG (không phải modal): submit xong render component success (`SubmitSuccess`) thay hẳn form. Form TRONG modal/drawer thì success = đóng overlay + toast — ngữ cảnh khác, không áp cùng quy tắc.

## Liên quan
`submit-requires-valid-input-fe-disable-be-throw` (engineering) · `disable-vs-lock-and-perrow-autosave` (principles — case auto-save per-field) · [[centered-form-setup]] (shell bao ngoài form) · card component §6.
