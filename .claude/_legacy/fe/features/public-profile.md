# Feature — PublicProfile
> Hồ sơ công khai — GitHub-style, xem được bởi bất kỳ ai. Nguồn: `features/profile/PublicProfile`.

- **Job**: 1 identity ổn định (trái) + nội dung đổi theo tab (phải): Overview/Challenges/Projects/Skills/CV(self)/Activity → shell [[dashboard-hub]].
- **CTA**: ĐÚNG 1 primary theo VAI người xem — recruiter đủ điều kiện (`openToWork` + có github) → "Liên hệ tuyển dụng"; khách lạ đã đăng nhập → `FollowButton`; chính chủ → "Sửa hồ sơ". `ShareProfileButton` luôn là secondary. → [[call-to-action]]
- **Links (onward)**: tab strip lazy-mount (mỗi tab tự fetch riêng, chưa mở chưa gọi); social links (GitHub/LinkedIn/website) mở tab mới; URL tự canonical hoá về `/profile/<username>` khi vào bằng handle cũ. → [[content-linking]]
- **Psychology**: social proof (avatar-group followers + medal strip badge đặt CAO trong cột, không chờ scroll); status/authority (avatar viền theo rank = "seniority flex", không phải XP thô); recruiter CTA CHỈ hiện khi tín hiệu thật (`openToWork` + github) — không mời liên hệ khi không đủ điều kiện. → [[persuasion-psychology]]
- **Ghi chú**: minh chứng tốt cho [[fair-monetization-axiom]] — hồ sơ không hiện 1 điểm tổng hợp giả (XP bị comment "intentionally omitted"); mọi tín hiệu tuyển dụng (band/qualified) đến từ dữ liệu track thật, không phải điểm cộng dồn theo số khóa đã mua.
