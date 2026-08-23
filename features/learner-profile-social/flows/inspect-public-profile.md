# Flow · Xem bằng chứng hồ sơ

> ID: `inspect-public-profile` · Trigger: Người xem mở /[lang]/profile/[username].

| # | Actor | Surface | Action | Result |
|---:|---|---|---|---|
| 1 | `viewer` | `profile-overview` | Mở profile và chọn nhóm bằng chứng. | Overview hoặc tab bằng chứng được mở. |
| 2 | `viewer` | `profile-skills` | Lọc history và mở một proof. | Chi tiết bài và accepted submission được hiển thị. |
| 3 | `viewer` | `profile-projects` | Chọn project hoặc capstone. | External project hoặc roadmap được mở. |
| 4 | `viewer` | `profile-challenges` | Chọn course rồi submission. | Proof đã pass được hiển thị. |
| 5 | `viewer` | `profile-activity-cv-wrapped` | Chọn activity, CV hoặc Wrapped. | Bằng chứng tương ứng được hiển thị hoặc empty/error trung thực. |

## Outcomes

- Mỗi nhóm bằng chứng có route riêng
- Follow edge phản ánh live counts và không trùng

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`
