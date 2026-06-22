# Business brainstorm — StarCi Academy (marketing-first, grounded từ source)

> Mọi value prop dưới đây neo vào capability CÓ THẬT trong code. Số liệu thị trường = giả định.

## 1. Inventory — source code nói ta bán được gì

| Nhóm | Capability thật (nguồn) | Trạng thái |
|---|---|---|
| 💰 Monetization | 5 payment gateway: SePay·PayOS (VN) + Stripe·PayPal·NOWPayments (quốc tế/crypto) — `src/modules/{sepay,payos,stripe,paypal,nowpayments}`; `membership` + premium-content-lock (`final-mvp`) | đã wired |
| 🛡️ Moat / AI | AI Balancer xoay key đa-provider (`modules/ai`), LangChain, Judge0 coding sandbox chấm code thật (`modules/judge0`) | đang dùng |
| 🎮 Engagement | Duolingo-style weekly **league** + **streak** + **achievement/badge** + **flashcard SM-2** (config `league/flashcard`, CQRS projection) | đã code |
| 📚 Content | Courses (Fullstack/System Design/DevOps), premium content, askContentAi, Elasticsearch search | đã có |

## 2. Định vị (Positioning — mẫu Dunford)
**Cho** dev VN muốn lên senior/system-design **mà** khoá học hiện có nặng lý thuyết, **StarCi Academy là** nền tảng học **practice-led + chấm code tự động bằng AI**, **khác** Udemy/roadmap ở chỗ: lab thật, sandbox chấm, gamification giữ thói quen — **bằng chứng**: Judge0 + AI balancer + league đã chạy.

## 3. ICP (ưu tiên 1)
1. **Dev 1–4 năm KN** muốn phá trần "mid → senior" (chính). 2. SV CNTT năm cuối cần portfolio. 3. (B2B) team/công ty cần upskill nội bộ — white-label.

## 4. Packaging & pricing (gắn thẳng gateway đã có)
- **Free**: 1 module + flashcard + league → tạo thói quen (growth).
- **Pro** (sub tháng/năm qua SePay/PayOS/Stripe): full course + premium content + AI mentor.
- **Credit packs** (NOWPayments/Stripe): chấm code/AI Q&A theo lượt — kiếm tiền từ user chưa sẵn sàng sub.

## 5. Growth loop
Bài học free chất lượng (KOL) → signup → học mỗi ngày (streak/league giữ chân) → khoe badge/leaderboard (UGC lan) → bạn bè vào → vòng lặp. + Referral credit.

## 6. Go-to-market & KOL (tận dụng 3 trụ: tech KOL · automation · blockchain)
1. **"Build in public"**: livestream agent tự audit/dựng chính nền tảng này → chứng minh năng lực automation.
2. **Series "chấm code của bạn bằng AI"**: dùng Judge0+AI balancer làm content hook trên TikTok/YouTube.
3. **Leaderboard challenge công khai** (UGC, viral vòng league).
4. **Blockchain angle**: lab System Design về sàn/DeFi (đã có executor/CLMM trong hệ) → tách nhóm học phí cao.
5. **Email + flashcard nhắc học** (Brevo đã tích hợp) → kéo retention.

## 7. Hướng CHỐT
**Content-led KOL funnel** — bài free → signup → trả phí. Lý do: tận dụng đúng thế mạnh KOL của thầy, growth loop rẻ, mọi mảnh (content/gamification/payment) đã sẵn trong code; chỉ cần lắp phễu, không cần build mới.

## Rủi ro / giả định
Quy mô thị trường & CAC = giả định, cần đo thật. Moat AI phụ thuộc chi phí key (đã có balancer giảm rủi ro).
