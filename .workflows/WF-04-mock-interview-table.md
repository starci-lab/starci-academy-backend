# WF-04 · Verify bảng `mock_interview_attempts` + degrade mềm

- **Status:** ✅ done (2026-07-04 — migration `1721500000000-CreateMockInterviewAttempts` + entity đã tồn tại; try/catch degrade của WF-02 giữ làm safety net; comment cập nhật)
- **Repo:** backend (`mtp`)
- **Effort:** S
- **Phụ thuộc:** —
- **Owner:** (chưa gán)

## Mục tiêu
Đảm bảo pillar "phỏng vấn" của track card không làm vỡ toàn bộ `compute()` khi bảng chưa tồn tại.

## Vì sao
`JobReadinessService` query thẳng `mock_interview_attempts` (AVG overall_score). Nếu migration chưa chạy → raw SQL ném lỗi → cả job-readiness vỡ runtime, không chỉ pillar phỏng vấn.

## Phạm vi
1. Kiểm bảng `mock_interview_attempts` đã migrate chưa (feature mock-interview whole-session — xem session brief; commit `0c5fdd5d3` gỡ bản flashcard cũ).
2. Nếu **đã có:** chạy migration + confirm; xong.
3. Nếu **chưa có:** làm pillar interview **degrade mềm** — bọc query, bảng vắng → `interviewScore = null` (card vẫn sống, chỉ thiếu 1 trụ), KHÔNG throw. Hoặc gate query sau khi confirm bảng tồn tại.

## Acceptance criteria
- [ ] `compute()` KHÔNG throw khi bảng `mock_interview_attempts` vắng.
- [ ] Khi bảng có: `interviewScore` tính đúng (AVG per enrollment).
- [ ] `tsc --noEmit` NO NEW ERRORS.

## Rủi ro / lưu ý
- Đây là chặn runtime cho WF-02 — nên làm sớm/song song.
- Confirm mock-interview feature (whole-session) có thật đang wire hay chỉ để lại bảng.
