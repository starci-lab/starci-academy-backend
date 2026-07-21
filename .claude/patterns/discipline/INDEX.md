# INDEX — discipline patterns (kỷ luật làm việc, domain-agnostic)

> **Nền LUÔN-BẬT, KHÔNG phải skill.** Không ai gõ `/verify-empirically` — 4 file dưới phải NGẤM và tự áp mọi lượt, mọi domain. Đặt cùng nhà code-pattern (thầy chốt 2026-07-22: "fe be giờ chỉ còn pattern code, principle dời legacy hết" → discipline đi thẳng vào `.claude/patterns`).
>
> Khác `patterns/{fe,be}` (cách VIẾT CODE — idiom, import, style) ở chỗ: đây là cách **LÀM VIỆC** (verify / chẩn đoán / sweep / git). Không gắn ngôn ngữ hay framework.
>
> **Vì sao tồn tại:** skill v1 DẶN nhưng không CHẶN/ĐO → biết luật mà vẫn phạm. Bằng chứng: memory `feedback-self-critique-before-presenting` — lỗi CourseCard "sửa <1s SAU khi thầy chỉ; thiếu tự soát, không thiếu kiến thức". Prose-không-gate = lỗi hệ thống lặp. 4 file dưới biến 4 "câu dặn" mơ hồ thành quy trình **ĐO được**.

| File | Kỷ luật | Trigger tự-áp (không đợi gõ) |
|---|---|---|
| [`verify-empirically.md`](verify-empirically.md) | Đo, không đọc | trước khi báo "xong / chạy được / đã sửa" |
| [`diagnose-before-fix.md`](diagnose-before-fix.md) | Tìm ĐÚNG tầng trước khi sửa | khi bug xuất hiện |
| [`safe-bulk-edit.md`](safe-bulk-edit.md) | Gate + dry-run trước sweep | khi sửa ≥ vài site cùng pattern |
| [`multi-session-git.md`](multi-session-git.md) | Fetch-before-write | khi ghi canon/shared, trước push |

## 4 nguyên tắc luôn-bật thuần (sống ở memory, không lặp ở đây)

`self-critique` · `honest-report` · `ground-in-source` · `ask-vs-default` — đã là memory `feedback-self-critique-before-presenting`, `feedback-analyze-and-approve-before-editing`, `feedback-canon-multisession-fetch-before-write`. Chúng là NGUYÊN TẮC thuần (không có quy trình đo riêng) → để ở memory. 4 file trên là phần **có quy trình đo cụ thể**.

Gốc phân tích: [`.claude-skills-v2/README.md`](../../../.claude-skills-v2/README.md) §2–§4.
