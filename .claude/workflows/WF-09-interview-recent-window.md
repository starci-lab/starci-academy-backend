# WF-09 · Interview pillar — cửa sổ recent-N thay vì avg mọi attempt

- **Status:** undone
- **Repo:** backend (`mtp`)
- **Effort:** S
- **Phụ thuộc:** WF-02 (shape — done)

## Mục tiêu
Đổi cách tính pillar "mock interview" trong `JobReadinessService` từ **AVG toàn bộ lịch sử attempt** sang **cửa sổ N lần gần nhất** (hoặc best-of-recent), để 1 lần phỏng vấn yếu hồi mới học không kéo tụt điểm của ứng viên giờ đã mạnh lên mãi mãi.

## Vì sao
Điểm interview hiện tại là trung bình CỘNG DỒN vô hạn (`AVG(overall_score) GROUP BY enrollment_id`) — càng luyện nhiều, càng khó kéo trung bình lên nếu có vài lần đầu điểm thấp (lúc mới học, đương nhiên yếu hơn). Đây là méo mó khác với "composite gộp theo số khóa" (đã sửa ở WF-02) nhưng cùng họ vấn đề: tín hiệu không phản ánh đúng NĂNG LỰC HIỆN TẠI. Recent-window đúng tinh thần thực tế hơn — nhà tuyển dụng quan tâm "bạn phỏng vấn tốt tới đâu BÂY GIỜ", không phải trung bình lịch sử.

## Phạm vi
1. **Ground:** `JobReadinessService.loadInterviewAverages` (`src/features/api/core/graphql/queries/users/job-readiness/job-readiness.service.ts`) — hiện tại:
   ```sql
   SELECT enrollment_id, AVG(overall_score) FROM mock_interview_attempts GROUP BY enrollment_id
   ```
2. Đổi query sang 1 trong 2 hướng (chốt với team trước khi code):
   - **(a) Recent-N average:** subquery/window function lấy N attempt gần nhất theo `createdAt` (per `enrollment_id`), rồi mới `AVG`. Ví dụ dùng `ROW_NUMBER() OVER (PARTITION BY enrollment_id ORDER BY created_at DESC)` rồi filter `<= N`.
   - **(b) Best-of-recent:** `MAX(overall_score)` trong cùng cửa sổ recent-N — nếu team muốn thưởng "đỉnh cao gần đây" thay vì trung bình.
3. Thêm 1 **config constant** (vd `INTERVIEW_RECENT_WINDOW = 5`) đặt cạnh service — KHÔNG hardcode số ma thuật trong query.
4. Cập nhật spec `job-readiness.service.spec.ts` (invariant test hiện có phải vẫn xanh + thêm case: attempt cũ yếu + attempt mới mạnh → điểm phản ánh xu hướng gần đây, không bị kéo bởi lịch sử).
5. Cập nhật comment/JSDoc giải thích rationale (để không ai "sửa lại thành AVG toàn bộ" trong tương lai mà không hiểu vì sao).

## Acceptance criteria
- [ ] Query interview pillar chỉ xét N attempt gần nhất (theo `createdAt DESC`) thay vì toàn bộ lịch sử.
- [ ] Constant cửa sổ (N) có tên rõ ràng, dễ chỉnh, không hardcode rải rác.
- [ ] Test mới: user có attempt cũ điểm thấp + attempt gần đây điểm cao → pillar phản ánh điểm gần đây (không bị kéo xuống bởi lịch sử cũ).
- [ ] Invariant test WF-01 (thêm track không đổi track khác) vẫn xanh.
- [ ] `tsc` NO NEW ERRORS, eslint 0.

## Rủi ro / lưu ý
- Cần CHỐT trước khi code: recent-AVG hay best-of-recent? (brief này để mặc định recent-AVG vì ít "gaming" hơn — best-of-recent dễ bị spam nhiều lần chờ 1 lần điểm cao).
- Cửa sổ N quá nhỏ (vd N=1) → dễ nhiễu (may rủi 1 lần); N quá lớn → gần như quay lại hành vi cũ. Cần vài lần chạy thử với data thật trước khi chốt N.
- Đổi công thức tính điểm là đổi shape số liệu hiển thị — nếu FE (WF-05/WF-06) đã render field này, cần re-verify UI không hiểu nhầm ý nghĩa con số (không cần đổi GraphQL field name, chỉ đổi cách tính).
