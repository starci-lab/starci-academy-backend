# 04 — Progress & Milestones

## §04.1 Theo dõi tiến độ
- **User Content** record: ghi nhận user đã đọc / xem video / tick complete lesson nào.
- **User Challenge Submission**: lưu mỗi lần học viên nộp challenge.
  - Attempt → feedback chain (xem §02.6).
- Progress hiển thị % hoàn thành module + course.

## §04.2 Milestone
- **Milestone** = mốc lớn trong course (vd: kết thúc M5, kết thúc tier Foundation).
- Mỗi milestone có **milestone task** — tổ hợp challenge + capstone phải hoàn thành.
- Khi user pass đủ task → unlock milestone → có thể nhận badge/cert tương lai.

## §04.3 Milestone task
- Mỗi task có **criteria** (rubric riêng, khác với challenge requirement).
- User nộp **milestone task attempt**, được consultant chấm, nhận **feedback**.
- Task có thể yêu cầu nhiều challenge phụ + 1 capstone output (vd: repo + design doc).

## §04.4 Pass điều kiện
- Mặc định: pass = đạt **threshold pts** trên rubric criteria (vd: ≥80% tổng điểm).
- Có loại task **all-pass** (mọi criteria phải đạt min) — dùng cho capstone milestone.
- Một số task cho phép **partial pass** với resubmit.

## §04.5 Resubmit chính sách
- Học viên có **unlimited attempts** trong thời gian enrollment còn hạn.
- Mỗi attempt cách nhau tối thiểu thời gian nguội (cooldown) — chống spam (giá trị do admin set).
- Feedback của attempt trước phải acknowledge mới được nộp attempt mới (yêu cầu UX).

## §04.6 Certification
- Hoàn thành toàn bộ milestone của course → eligible cho certificate.
- Cert gắn user + course + ngày hoàn thành.
- Cert có **template CV** generated tự động (xem §07).
- Cert hợp lệ vô thời hạn (không revoke khi course version update).

## §04.7 Quy tắc liêm chính (academic integrity)
- Submit code copy nguyên xi từ học viên khác → fail attempt, không trừ enrollment.
- Tái phạm 3 lần → consultant flag, admin review → có thể khoá enrollment.
- Code có dấu hiệu copy public (GitHub repo có sẵn) phải declare reference — không declare = trừ.

## §04.8 Lifecycle progress khi enrollment thay đổi
- Enrollment expired → progress freeze (read-only).
- Enrollment refund → progress giữ lại trong DB, ẩn khỏi UI user.
- Re-enroll cùng course → progress cũ resume (không reset).
