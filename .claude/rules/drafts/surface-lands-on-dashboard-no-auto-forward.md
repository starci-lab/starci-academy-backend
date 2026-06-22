# Draft — Surface CÓ dashboard/overview phải LAND ở dashboard, KHÔNG auto-forward vào item (2026-06-21)

- File/§ đích khi `/merge`: `main.md` §14 (heuristics) + [[course-home-no-duplicate-surfaces]] + [[continue-resumes-content-not-capstone]].
- Bối cảnh: thầy mở `/learn/personal-project` thấy bị nhảy thẳng vào brief 1 task (`/personal-project/tasks/388…`),
  *"dashboard đang mặc định forward vào bài viết"*. Gốc: `useDefaultRedirect` (global effect trong
  `hooks/effects/UseEffects.tsx`) `router.replace` từ `/learn/personal-project` (base) → task đầu tiên
  (`useDefaultRedirect.ts` L77–91), và `/learn/modules` (base) → module/bài đầu (L50–65). → `PersonalProjectDashboard`
  (overview KPI) **không bao giờ render được** dù đã dựng.

## Luật (STRICT)
- **Surface mà CÓ trang dashboard/overview riêng (continue · % · path · KPI) thì landing của surface đó = DASHBOARD,
  KHÔNG `router.replace` đá người học thẳng vào item đầu/đang-làm (bài/task).** Auto-forward làm dashboard chết (không
  ai thấy) + cướp mất "bạn đang ở đâu / làm gì tiếp" trước khi user kịp định hướng. Người học **tự bấm "Tiếp tục"**
  (resume pointer) để vào item — đó là 1 primary action có chủ đích, không phải redirect ngầm.
- **Phân biệt 2 loại base route:**
  - **Có dashboard** (personal-project: `PersonalProjectDashboard`; content-home: course dashboard) → **GỠ auto-forward**,
    để land ở dashboard. Resume vào item qua nút "Tiếp tục" (`currentTask`/`nextContentTask`).
  - **Chỉ là list/không có overview** (vd `/learn/modules` nếu không có "module dashboard") → forward vào item đầu
    có thể chấp nhận (không có gì để land). NHƯNG nếu content-home đã là dashboard tổng cho nội dung thì cân nhắc bỏ
    luôn forward của `modules` (vào `/learn/modules` hiếm khi xảy ra trực tiếp; reader tự mở từ rail/continue).
- **Hệ quả kỹ thuật:** sửa `useDefaultRedirect.ts` — bỏ nhánh `onPersonalProjectBase` (để `PersonalProjectWorkspace`
  render dashboard khi `!taskId`). Giữ hay bỏ nhánh `modules` tuỳ quyết định thầy. Cập nhật comment stale trong
  `personal-project/layout.tsx` ("default-task redirect").

## ĐÃ ÁP DỤNG 2026-06-21 (thầy duyệt)
- Gỡ nhánh `onPersonalProjectBase` khỏi `useDefaultRedirect.ts` → `/learn/personal-project` land thẳng
  `PersonalProjectDashboard`, KHÔNG còn forward vào task đầu. Dọn import chết theo (`setSelectedTaskId`,
  `MilestoneEntity`, `useAppDispatch`, `getFirstPersonalProjectTaskId`, selector `milestone.entities`).
- **GIỮ** nhánh `modules` (`/learn/modules` → bài đầu) — module list không có overview riêng, reader là nội dung.
- Cập nhật comment stale trong `personal-project/layout.tsx`. `/learn/content` vốn đã land dashboard (không dính hook).
- **Ref nguyên tắc:** [[course-home-no-duplicate-surfaces]] (home = continue/progress/path, 1 primary action) +
  [[continue-resumes-content-not-capstone]] (resume là hành động có chủ đích, đúng phạm vi surface).
