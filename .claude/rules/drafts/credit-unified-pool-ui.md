# Draft — UI credit/hạn mức bám "unified pool", không tách lane theo nguồn (2026-06-18)

> **Bổ sung 2026-07-06 (b):** `GradeModelDropdown` có **2 kiểu trigger**: (1) **compact** (inline "✦ Tự động ⌄" + `GradeCreditCaption` bên phải cùng hàng — dùng card HẸP, vd interview setup); (2) **`isDropdown`** (field bordered kiểu `Select`, Label ngoài + quota bên phải — sidebar RỘNG, vd CV editor). Sparkle (trái) + caret (phải) của trigger "Tự động" = **`size-4`** (cả 2 kiểu). `GradeCreditCaption` ("Còn N/M credit tuần này") = **`text-sm`** (không `text-xs`).

> **Bổ sung 2026-07-06 (STRICT):** **Lane "Tự động" (Auto model) LUÔN kèm credit hiển thị NGAY CẠNH picker** — user phải thấy "còn bao nhiêu credit" TRƯỚC khi bấm hành động tốn AI (chấm/generate), không giấu tới lúc hết mới báo. Đọc từ `myAiQuota.credit` (unified, tier-aware: `remainingWeek`/`limitWeek`) — dòng `body-xs muted` cạnh `GradeModelDropdown` khi `!selection.model` (Auto lane). Precedent logic: `resolveGradeCreditDisplay` (ChallengeSubmissionPanel) — nợ: trích thành block/util DÙNG CHUNG (`blocks/grading`) thay vì copy per-feature ([[single-source-render]]). Áp: `MockInterviewSession` setup (Auto + "Còn {remaining}/{quota} credit tuần này"). GradeModelDropdown (block chung) KHÔNG tự query credit (tránh bloat mọi caller) → credit render ở FEATURE cạnh dropdown.

- File/§ đích khi `/merge`: `main.md` §14 (heuristics) + `starci-stats.md` (nếu có khối quota/credit).
- Bài học: trang `ai-usage` render 2 lane riêng (Auto đọc `myCreditUsage` + Premium đọc `myAiQuota`) trong khi
  BE đã gộp về **1 pool credit thống nhất** (`myAiQuota.credit` 5h+week) → UI lệch model, trùng lặp, khó hiểu.
  Tương tự `ai-settings` cho user bấm chọn lane Auto/Premium/BYOK trong khi lane do tier+key TỰ suy.

## Luật (STRICT)
- **Hạn mức/credit = 1 pool, hiển thị theo WINDOW (5h / 7 ngày), KHÔNG tách theo lane/nguồn.** Nguồn
  (auto/premium/byok) là cách BE TÍNH tiền, **không phải trục hiển thị** cho user. Đọc thẳng pool thống nhất
  (`myAiQuota.credit`), đừng dựng 2 thanh "auto" vs "premium".
- **Đừng cho user chọn cái hệ thống tự suy.** Nếu BE tự quyết (vd `effectiveMode` natural order byok→premium→auto
  theo tier+key), thì UI chỉ **hiển thị read-only** trạng thái đó, không dựng selector cho user bấm (gây mâu thuẫn
  canPremium/khoá/chưa-nhập-key). User chỉ chỉnh INPUT thật sự thuộc về họ (vd BYOK key).
- **Trang settings = 1 việc rõ.** Khi 1 trang chỉ còn 1 input ý nghĩa (vd BYOK key), cắt mọi lựa-chọn-thừa,
  đặt input đó làm primary, thêm cross-link sang trang liên quan (vd Gói AI) thay vì nhồi card khoá-mờ.
