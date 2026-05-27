# 07 — Career Services

## §07.1 Tổng quan
StarCi không chỉ dạy — sau khi học xong, học viên có thể dùng các dịch vụ nghề nghiệp:
- **CV template** + submission để consultant feedback.
- **Job board** từ partner headhunting.
- **Consultant 1-1** tư vấn nghề (xem §08).

## §07.2 CV Template
- Hệ thống cung cấp các **template CV** sẵn — thiết kế cho fresher / mid / senior dev.
- Mỗi template có metadata: tên, mô tả, level phù hợp, preview image.
- User chọn template → fill thông tin → tạo CV draft.

## §07.3 CV Submission
- User submit CV draft để được consultant review.
- Mỗi submission có **attempts** (resubmit sau khi nhận feedback).
- Submission state: `pending` → `reviewing` → `feedback_given` / `accepted`.
- Consultant để **feedback** chi tiết (text + comment trên field cụ thể).

## §07.4 Quyền submit CV
- User đã enroll ít nhất 1 course mới được submit CV.
- Hoặc user pass certification (xem §04.6) — ưu tiên review nhanh.

## §07.5 Headhunting Company
- **Headhunting company** = đối tác tuyển dụng đã ký với StarCi.
- Mỗi company có profile: tên, logo, mô tả, lĩnh vực, quy mô.
- Company được verify trước khi đăng job lên platform (admin duyệt).

## §07.6 Job Board
- Mỗi **job** thuộc về 1 headhunting company.
- Job có: title, mô tả JD, mức lương range, level yêu cầu, kỹ năng, location (remote / on-site / hybrid).
- Job có thời gian active (from–to), hết hạn auto hide.

## §07.7 Apply job
- User xem job → click "Apply" → consultant intro hộ user vào company.
- Không có direct application flow trong sản phẩm v1 (consultant làm trung gian).
- Lý do: kiểm soát chất lượng matching, tránh spam.

## §07.8 Matching ưu tiên
- User có cert + portfolio milestone tốt → được consultant chủ động giới thiệu trước.
- Job board hiển thị job phù hợp level user (dựa trên cert + history submission).

## §07.9 Quy tắc dữ liệu nhạy cảm
- CV chứa info cá nhân (CCCD, lương cũ) — chỉ user + consultant assigned + admin xem.
- Không share CV cho company nếu user chưa consent (explicit opt-in).
- Job board không chứa thông tin contact user — company liên hệ qua StarCi.
