# Concept — UI credit/hạn mức = POOL THỐNG NHẤT theo WINDOW, không tách lane theo nguồn

> Heuristic (họ `concepts/*`). Bổ trợ [[ai-credit-caption-bound-to-picker-not-button]] (caption gắn picker) + [[fair-monetization-axiom]] (entitlement theo tier/pool, không theo count) + [[single-source-render]].

## Nguyên tắc (STRICT)
- **Credit/hạn mức = 1 POOL, hiển thị theo WINDOW (5h / 7 ngày), KHÔNG tách theo lane/nguồn.** Nguồn (auto/premium/byok) là cách BE TÍNH tiền, **không phải trục hiển thị** cho user. Đọc thẳng pool thống nhất (`myAiQuota.credit`: `remaining5h/limit5h`, `remainingWeek/limitWeek`), đừng dựng 2 thanh "auto" vs "premium".
- **Đừng cho user chọn cái hệ thống TỰ SUY.** BE tự quyết lane (vd `effectiveMode` theo tier + key) → UI chỉ **hiển thị read-only** trạng thái đó, KHÔNG dựng selector cho user bấm (gây mâu thuẫn canPremium/khoá/chưa-nhập-key). User chỉ chỉnh INPUT thật sự thuộc về họ (vd BYOK key).
- **Lane "Tự động" LUÔN kèm credit NGAY CẠNH picker** — user phải thấy "còn bao nhiêu" TRƯỚC khi bấm hành động tốn AI (chấm/generate), không giấu tới lúc hết mới báo. Feature query `myAiQuota` + render caption cạnh `GradeModelDropdown`; **block KHÔNG tự query credit** (nhiều caller free-lane không cần → tránh bloat). Chi tiết caption: [[ai-credit-caption-bound-to-picker-not-button]].
- **`GradeModelDropdown` 2 kiểu trigger:** (1) **compact** (inline "✦ Tự động ⌄" + credit caption cùng hàng — card HẸP); (2) **`isDropdown`** (field bordered kiểu `Select`, Label ngoài + quota bên phải — sidebar RỘNG). Sparkle + caret = `size-4`; caption = `text-sm`.
- **Trang settings = 1 việc rõ.** Khi chỉ còn 1 input ý nghĩa (vd BYOK key) → cắt mọi lựa-chọn-thừa, đặt input đó làm primary + cross-link sang trang liên quan (vd Gói AI), KHÔNG nhồi card khoá-mờ.
