# WF-06 · FE — dashboard self-widget + copy discipline

- **Status:** ✅ done (2026-07-04 — hook `useQueryMyJobReadinessSwr` + `JobReadinessWidget` + slot OverviewTab; CTA theo trụ thiếu (capstone/interview/cv), KHÔNG fallback "mua khóa"; grep xác nhận 0 câu purchase↔score; i18n 5 key mới vi/en khớp; tsc/eslint sạch)
- **Repo:** frontend (`starci-academy`)
- **Effort:** M
- **Phụ thuộc:** WF-02 (shape), WF-05 (pattern dùng lại)
- **Owner:** (chưa gán)

## Mục tiêu
Widget "Độ sẵn sàng của tôi" trên dashboard (self view) + CTA hướng user **hoàn thiện trụ còn thiếu** / **build thêm CV** — và khoá copy để KHÔNG bao giờ gợi ý "mua thêm khóa để tăng điểm".

## Vì sao
Dashboard = growth loop cho học viên. CTA phải kéo về hành động THẬT làm mạnh hồ sơ (làm capstone / luyện phỏng vấn / build CV ngôn ngữ khác), không phải upsell điểm. Đây là chỗ dễ vô tình phá fairness bằng ngôn từ.

## Phạm vi
1. **Hook** `useQueryMyJobReadinessSwr.ts` (mirror `useQueryMyAiQuotaSwr`, KHÔNG userId) → field `myJobReadiness`.
2. **Widget** `src/components/features/dashboard/OverviewTab/JobReadinessWidget/` + `LabeledCard`, slot trong `OverviewTab/index.tsx`.
   - Hiện headline track mạnh nhất + foundation + trụ còn thiếu.
   - **CTA theo trụ thiếu:** capstone chưa xong → "Hoàn thành capstone"; chưa phỏng vấn → "Luyện phỏng vấn"; CV yếu/thiếu → "Tạo/tuỳ chỉnh CV" (user tự customize — KHÔNG ép ngôn ngữ; có thể gợi ý "tạo CV mới cho role khác").
3. **i18n** `jobReadiness.*` (vi/en).

## Copy discipline (BẮT BUỘC)
- ✅ Được: "hoàn thiện track hiện tại", "build CV cho ngôn ngữ khác", "học thêm domain mới để mở rộng cơ hội".
- ❌ CẤM: "mua thêm khóa để tăng điểm/độ sẵn sàng", bất kỳ câu gắn số readiness với việc mua khóa.
- Upsell khóa mới chỉ nói **kỹ năng mới + thêm track badge (diện rộng)**, KHÔNG nhắc điểm.

## Acceptance criteria
- [ ] Widget self hiện đúng; CTA trỏ hành động thật (không phải mua khóa).
- [ ] Không có chuỗi copy nào gắn "mua khóa" với "tăng điểm/readiness" (grep review).
- [ ] `tsc` + eslint sạch; vi/en khớp key.

## Rủi ro / lưu ý
- Card có thể self-hiding khi chưa đủ data — theo convention dashboard widget hiện có.
- Review copy vi + en cùng lúc (dễ lọt câu upsell ở 1 ngôn ngữ).
