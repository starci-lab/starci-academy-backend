# Draft — UI credit/hạn mức bám "unified pool", không tách lane theo nguồn (2026-06-18)

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
