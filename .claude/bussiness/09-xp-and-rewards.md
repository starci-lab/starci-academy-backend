# 09 — XP & Rewards (Điểm thưởng)

> **Scope hiện tại = chỉ XP.** Coin / đổi quà là **Phase 2** (tính sau). Phần Coin dưới đây giữ lại để định hướng, chưa triển khai.

## §09.1 Hai loại điểm (tách biệt)
- **XP (điểm tích luỹ)** — chỉ tăng, không bao giờ bị trừ. Dùng để **cày rank** (leaderboard) + hiện **thành tích** trong profile. **KHÔNG** tiêu được.
- **Coin (điểm xài được)** — số dư như ví. Dùng để **đổi quà**; giảm khi đổi quà.
- Hai con số **độc lập**: tiêu Coin không ảnh hưởng XP/rank, và ngược lại.

## §09.2 XP tính theo từng khóa
- XP **gắn với từng course riêng**, **KHÔNG** cộng tổng toàn hệ thống — để công bằng giữa người học khóa ngắn và người học nhiều khóa.
- Mỗi course có **leaderboard riêng**, xếp theo XP giảm dần (tie-break: enroll sớm hơn đứng trên, theo quy ước rank hiện hành — xem §04).
- Profile hiện XP + thành tích **theo từng course**, không có "điểm tổng".

## §09.3 Nguồn cộng XP
- **Đọc xong 1 bài (lesson)** = **+3 XP**. Tính khi user đọc tới cuối bài và bài được đánh dấu đã đọc (**User Content**). Mỗi bài cộng **đúng 1 lần**; đọc lại không cộng thêm.
- **Pass challenge** = XP theo **điểm số của challenge** đó (theo cơ chế scoring §02). Lấy **điểm cao nhất** của user cho challenge — nhiều lần nộp không cộng dồn.
- **Milestone** = **+10 XP mỗi progress** (mỗi bước tiến của milestone task — xem §04.3).
- Lưu ý: cách tính rank cũ chỉ đếm điểm challenge; nay XP **gộp thêm** đọc bài + milestone progress.

## §09.4 Thành tích (profile)
Hiện trong profile của user, **theo từng course**:
- Số **challenge** đã hoàn thành.
- Số **bài (lesson)** đã đọc.
- Số **milestone progress** đã đạt.
- Tổng **XP** của course + **thứ hạng** trong course.

## §09.5 Coin & đổi quà (Phase 2 — tính sau)
- Đổi quà: chọn quà → trừ Coin tương ứng → cấp quà. **Không** cho đổi nếu số dư Coin không đủ.
- Mọi lần đổi quà phải ghi nhận lại (audit) để không thất lạc số dư.
- Cơ chế & mức **kiếm Coin** và **danh mục quà**: chưa chốt — xem §09.7.

## §09.6 Liêm chính / chống farm
- XP đọc bài: mỗi bài **1 lần**; đọc lại không cộng.
- XP challenge: chỉ tính **điểm cao nhất**, nộp lại nhiều lần không nhân điểm.
- Tinh thần: XP phản ánh **năng lực + tiến độ thật**, không phải số lần thao tác.

## §09.7 Điểm chưa chốt (cần quyết định)
- **Phạm vi Coin**: theo từng course (như XP) hay **1 ví chung** toàn tài khoản (vì quà thường global).
- **Cách kiếm Coin**: mỗi hành động cho bao nhiêu Coin, hay Coin được phát song song với XP, hay đổi/quy từ XP.
- **Danh mục quà**: AI credit / mở sớm content / voucher thật / cosmetic-badge.
- **Chống fake đọc**: ngoài "1 lần/bài", có cần thêm điều kiện (vd thời gian tối thiểu trên trang) không.
- **Nguồn XP lặp lại** để cày rank dài hạn sau khi đã học hết course (vd ôn quiz spaced-repetition / daily streak) — vì XP first-clear có trần, học hết là đụng nóc.
