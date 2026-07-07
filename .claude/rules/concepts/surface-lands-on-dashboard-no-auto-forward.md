# Concept — Surface CÓ dashboard/overview phải LAND ở dashboard, KHÔNG auto-forward vào item

> Heuristic (họ `concepts/*`). Rút từ `/learn/personal-project` bị `router.replace` thẳng vào brief 1 task. Bổ trợ [[course-home-no-duplicate-surfaces]] + [[continue-resumes-content-not-capstone]].

## Quy tắc (STRICT)
- **Surface CÓ trang dashboard/overview riêng (continue · % · path · KPI) → landing của surface = DASHBOARD, KHÔNG `router.replace` đá người học thẳng vào item đầu/đang-làm (bài/task).** Auto-forward làm dashboard chết (không ai thấy) + cướp mất "bạn đang ở đâu / làm gì tiếp" trước khi user kịp định hướng. Người học **tự bấm "Tiếp tục"** (resume pointer) để vào item — 1 primary action có chủ đích, không phải redirect ngầm.
- **Phân biệt 2 loại base route:**
  - **Có dashboard** (personal-project home, content-home) → **GỠ auto-forward**, land ở dashboard. Resume vào item qua nút "Tiếp tục" (`currentTask`/`nextContentTask`).
  - **Chỉ là list/không có overview** (vd `/learn/modules` nếu không có "module dashboard") → forward vào item đầu có thể chấp nhận (không có gì để land). Cân nhắc bỏ luôn nếu content-home đã là dashboard cho nội dung.
- **Hệ quả kỹ thuật:** sửa hook default-redirect — bỏ nhánh forward cho route có dashboard (để workspace render dashboard khi `!taskId`); dọn import chết theo; cập nhật comment stale.

## Liên quan
- [[course-home-no-duplicate-surfaces]] (home = job riêng, 1 primary action) · [[continue-resumes-content-not-capstone]] (resume có chủ đích, đúng phạm vi) · [[learn-home-surfaces-share-flat-chrome]] (chrome flat của home).
