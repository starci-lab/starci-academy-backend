# Feature — UserStreak
> Widget "đà học" trong navbar (dropdown flame icon). Nguồn: `features/profile/UserStreak`.

- **Job**: xem lướt streak hiện tại từ BẤT KỲ đâu trong app → không có shell trang; đây là 1 popover gắn ở vùng navbar (region: navbar utility slot, không thuộc archetype layout nào).
- **CTA**: KHÔNG có — chỉ hiển thị, không nút hành động, không link "học ngay" trong dropdown. → [[call-to-action]]
- **Links (onward)**: KHÔNG — dropdown là ngõ cụt thông tin, không dẫn đi đâu (kể cả không link sang Dashboard nơi có `StreakStrip` thật). → [[content-linking]]
- **Psychology**: định dùng habit-loop hook chuẩn (flame icon + dải 7 ngày M-T-W-T-F-S-S + "current/longest") — đúng công thức Duolingo-style streak. → [[persuasion-psychology]]
- **Ghi chú**: **BROKEN/WEAK — cần sửa.** `streak.current`/`streak.longest` là số **hard-code `0`** (`<Typography>0</Typography>`, không query gì) và dải 7-ngày là markup tĩnh (không dùng `useQueryMyWeeklyStatsSwr` như `StreakStrip` thật trên Dashboard đang dùng đúng). Kết quả: hook tâm lý có mặt về UI nhưng KHÔNG hoạt động — 1 bản trùng lặp, không đồng bộ với widget streak thật. Nên trỏ chung 1 nguồn data với `dashboard/StreakStrip` ([[single-source-render]]) hoặc bỏ widget này, tránh 2 nơi cùng "streak" lệch nhau.
