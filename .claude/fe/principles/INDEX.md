# INDEX — Principles (nguyên tắc xuyên-suốt)

> Bản đồ đầy đủ của shelf `principles/`. Principle = heuristic chi phối NHIỀU component/pattern (không neo vào 1 element). Khác `components/` (canon 1 element cụ thể: Button, Card, Input…) và `patterns/` (1 tình huống/layout cụ thể: when-drawer, empty-state…) — principle là LUẬT NỀN mà các component/pattern đó phải tuân theo.
>
> **Trạng thái:** ✓ = đã có, đầy đủ · **STUB** = mới viết brief (2026-07-07), cần dày thêm khi có case thật · **TODO** = biết thiếu, chưa viết.

## 1. Visual language (ngôn ngữ thị giác)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[accent-system]] | ✓ | Accent = tín hiệu cho đúng 4 vai (CTA · đang-chọn · brand · của-tôi), mỗi element 1 kênh; "đang chọn" (tonal) ≠ "trạng thái" (icon-only) | button, chip, sidebar, list, color, progress/meter |
| [[hover-style-matches-clickable-nature]] | ✓ | Kiểu hover khớp bản chất click: go-there→underline · user-identity→opacity · stay-here→fill | card, list, button, sidebar |
| [[learning-surface-grounded-in-pedagogy-not-superficial-gamify]] | ✓ | Bề mặt học phản ánh sư phạm thật (SM-2 grade rời, retrieval, chấm-cuối) — KHÔNG gamify hời hợt (emoji/pastel/điểm giả) | rating, card §3g, dashboard |
| [[visual-hierarchy]] | STUB | 1 hành động CHÍNH/màn; phân cấp bằng size/weight/màu của cùng 1 hệ, không bằng thêm khung/hộp | button, header, label, card |
| [[design-restraint]] | STUB | Trọng lượng thị giác TỐI THIỂU cần để truyền đạt — cắt vanity, whitespace trước divider, accent 60-30-10 | card, list, chip, accent-system |
| [[advanced-tech-flexes-capability-not-decoration]] | ✓ | ⭐ **Đặc tính nền tảng:** tech nặng (3D/three.js · react-flow) để **FLEX năng lực** (authority, "dạy được→build được"), KHÔNG làm màu — phải phục vụ mục đích + honest (reduced-motion) | architecture, mind-map, mock-interview, landing, marketing, motion, a11y |

## 2. Content / voice (chữ nghĩa)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[no-emoji]] | ✓ | Không emoji trong UI — cần biểu tượng thì dùng icon Phosphor | icon, chip, mọi i18n string |
| [[no-uppercase-text]] | ✓ | Không uppercase/ALL-CAPS trừ khi được duyệt riêng | label, chip, header |
| [[content-voice]] | STUB | Umbrella: tiếng Việt tự nhiên (không lẫn English khi có từ Việt), dịch theo nghĩa, i18n vi/en song song; no-emoji + no-uppercase là 2 thành viên | landing-marketing, i18n toàn app |

## 3. Architecture / consistency (nhất quán kiến trúc)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[single-source-render]] | ✓ | 1 đại lượng hiển thị ở N nơi = ĐÚNG 1 component render dùng chung, không copy logic ra từng feature | price, card, list, chip |
| [[grounded-in-data]] | STUB | Thiết kế cho dữ liệu THẬT đang có (kể cả null/rỗng phổ biến), không cho schema lý tưởng chưa ai điền | landing-marketing, mọi empty-state |

## 4. Interaction (tương tác)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[interactive-needs-hover]] | ✓ | Mọi interactive phải có hover + cursor-pointer, kích bằng CẢ element qua `group` | button, card, label, list |
| [[resume-cta-only-when-away]] | ✓ | CTA "tiếp tục/resume" chỉ hiện khi đã rời vị trí đang dở — ẩn khi vô tác dụng | sidebar, header, dashboard |
| [[progressive-disclosure]] | STUB | Nội dung phụ giấu sau 1 label+caret, mở Drawer/Accordion khi cần; nội dung chính luôn bày thẳng | when-drawer, accordion, label |
| [[affordance-and-feedback]] | STUB | Umbrella: mọi interactive có hover/cursor/focus; mọi vùng async xử lý rõ loading/empty/error, không im lặng render rỗng | interactive-needs-hover, AsyncContent patterns |

## 5. Accessibility

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[accessibility]] | STUB | AA contrast · focus-visible ring · aria-label cho icon-only · màu không bao giờ là kênh thông tin duy nhất | color, icon, button, input |

## 6. Conversion (dẫn hành động, nối nội dung, thuyết phục)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[call-to-action]] | ✓ | 1 primary CTA/màn, bắn khi Motivation×Ability đủ cao (Fogg), copy outcome không feature | button, header, region-model |
| [[content-linking]] | ✓ | Không màn nào là ngõ cụt — mọi surface có đường onward (funnel/resume/related), deep-link mang ý định | entity-link, header (breadcrumb/back-link), layout-must-funnel |
| [[persuasion-psychology]] | ✓ | Đòn tâm lý (Cialdini/Fogg/Hook/goal-gradient) CHỈ hợp lệ khi grounded vào field BE thật — cấm dark pattern | commerce, dashboard, fair-monetization-axiom |

## 7. Debugging

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[heatmap-trong-la-bug-token-khong-redesign]] | ✓ | "Trông nhạt/vỡ/mất màu" → nghi bug token CSS TRƯỚC, đừng nhảy sang redesign | color tokens, mọi element "trơn" bất thường |

## 8. Process / governance (quy trình làm việc — không phải luật thị giác, là luật CÁCH LÀM)

| Principle | Trạng thái | Rule of thumb | Chi phối |
|---|---|---|---|
| [[self-critique-before-presenting]] | ✓ | ⭐ Tự đóng vai thầy phản biện TRƯỚC khi trình (hướng · code · finding · "xong") — đọc hết section canon (không chỉ 1 rule), kiểm chứng bằng grep không bằng lời kể, đừng chốt ở lựa chọn đầu tiên | MỌI skill `starci-fe-*` (brainstorm · apply · scan · feedback) |
| [[three-layer-sync-truth-story-ui]] | ✓ | ⭐⭐ `.claude/fe`=CHÂN LÝ · story=UI-REF · component=UI-trên-nền; chạm 1 lớp → reconcile CẢ 3 (chỉnh component → đối chiếu luật + cập nhật story). Recipe: [[../patterns/reconcile-three-layers-on-change]] | MỌI skill `starci-fe-*` |

## Ghi chú — dọn shelf (2026-07-07, dời/xoá KHÔNG viết lại nội dung)

- ✅ `highlight-accent-as-detail-not-block-fill` → hợp nhất vào [[accent-system]] (xoá file, redirect 7 ref).
- ✅ `status-icon-overrides-base` · `challenge-section-labeledcard-quiet-eyebrow-icon-once` · `modal-body-no-padding-override-heroui-idiom` · `disable-vs-lock-and-perrow-autosave` → **DỜI sang `components/`** (luật component cụ thể; giữ nguyên nội dung, CHƯA fold vào file element đích — fold cần viết lại chữ, để sau).

Còn lại (đúng chỗ, hoặc cần chẻ chữ → không dời/xoá được):
- `landing-marketing.md` → GIỮ Ở ĐÂY; §1 grounded-in-data là principle (đã rút ra `grounded-in-data.md`/`content-voice.md`), §2-10 là pattern/product cho landing — chẻ khi cần.
- `card.md` (ở đây) = heuristic "khi nào dựng card" (đúng chỗ). KHÁC `components/card.md` (canon Card).

## Cách dùng
- Viết 1 rule mới cho 1 component cụ thể → `components/`. Viết 1 tình huống/layout cụ thể (empty-state, canvas full-bleed, drawer…) → `patterns/`. Viết 1 luật chi phối NHIỀU component không neo vào 1 cái → **ở đây**.
- Trước khi thêm 1 STUB mới thành ✓: gom case thật ("Áp đầu") giống các file ✓ khác trong shelf này.
