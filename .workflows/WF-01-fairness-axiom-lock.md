# WF-01 · Khoá invariant công bằng (test + rule doc)

- **Status:** ✅ done (2026-07-04 — tsc/eslint sạch; invariant test compile khớp shape WF-02)
- **Repo:** backend (`mtp`)
- **Effort:** S
- **Phụ thuộc:** —
- **Owner:** (chưa gán)

## Mục tiêu
Đóng đinh luật công bằng TRƯỚC khi refactor, để không session/PR nào lỡ tay thêm lại điểm phồng theo số khóa (như breadthBonus cũ).

## Vì sao
Composite/breadthBonus vi phạm vì có 1 scalar lên cơ học theo số enrollment. Test + rule doc = hàng rào để mọi thay đổi tương lai không tái phạm.

## Phạm vi
1. **Rule doc** `.claude/rules/concepts/fair-monetization-axiom.md`:
   - Chép mô hình 4 lớp (per-track card / global foundation / engagement / entitlement) từ `.workflows/00-INDEX.md`.
   - Luật vàng: *"tín hiệu quyết định cơ hội/tiền KHÔNG được lên cơ học theo số khóa"*.
   - Liên kết `[[shared-modules-global-once-at-app-root]]` style, đặt cạnh các concept BE khác.
2. **Guardrail tests** (jest, `@modules/tests`):
   - `job-readiness.service.spec.ts`: thêm track thứ 2 (giữ nguyên depth cao nhất + foundation) → điểm/headline KHÔNG đổi. Bằng chứng "1 khóa = N khóa".
   - Khẳng định `AiEntitlementService.hasActiveEnrollment` (hoặc tương đương) cho kết quả y hệt với 1 vs 3 enrollment (chỉ `> 0`) — `src/modules/ai/ai-entitlement.service.ts`.
   - Khẳng định `ConsultantContactGateService` chỉ nhận `bestCvScore`, không nhận danh sách course — `src/modules/bussiness/headhuntings/consultant-contact-gate.service.ts`.

## Acceptance criteria
- [ ] Rule doc tồn tại, mô tả 4 lớp + luật vàng.
- [ ] 3 test pass; test job-readiness FAIL nếu ai đó thêm lại 1 hạng cộng-theo-count.
- [ ] `tsc --noEmit` NO NEW ERRORS; eslint 0 ở file đụng.

## Rủi ro / lưu ý
- Test viết TRƯỚC WF-02 refactor → có thể đỏ tạm tới khi WF-02 xong (đó là chủ đích: test định nghĩa đích).
- Đừng test giá trị điểm tuyệt đối (dễ vỡ) — test **bất biến** (thêm track không đổi điểm).
