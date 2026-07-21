# Proposal — Ôn tập "Thống kê" render LẠI: dẫn bằng OUTCOME + việc-cần-sửa (thay wall-of-vanity)

> Chốt 2026-07-13 (deep-scan 2 agent FE+BE + visual before/after show_widget `flashcard_review_stats_redesign`, thầy chọn **Full: hero hành động + BE mới**). Thầy: "thống kê này vô nghĩa quá, brainstorm với biz hiện tại để render lại".
> Surface: `FlashcardReviewStats` (`/learn/flashcards/review?tab=stats`, study-mode overview sub-tab). Job = **duy trì trí nhớ + biết CẦN SỬA gì** — không phải đếm vanity-metric hoạt-động.

## Chẩn đoán (vì sao "vô nghĩa" dù data đầy đủ)
Mọi field query fetch ĐỀU đã render — không thiếu data. Vấn đề = **chọn sai việc để làm hero**:
- Hero "0 Thẻ đến hạn hôm nay" = số 0 to đùng, chết cứng, không mời hành động.
- Retention 42% + grade + mastery = readout thụ động, không trả lời "vậy giờ làm gì".
- 2 chart hoạt-động TRÙNG nhau (bar 14 ngày + heatmap 90 ngày) = đo CÔNG SỨC, thưa với user mới.
- byDeck = FOOTPRINT (ôn X/Y thẻ, N phiên) — không phải deck nào đang QUÊN.
→ Toàn passive/effort. Thiếu hẳn "việc CẦN SỬA" (thẻ hay quên/leech, tag/deck yếu) = thứ DUY NHẤT biến Thống kê thành phễu học lại (call-to-action + fair-monetization: nudge để HỌC).

## Data-ceiling map (đi kèm proposal — grounded từ deep-scan)

### Đang render (giữ, chỉ reframe/đổi vị trí)
| Field | Nguồn | Số phận |
|---|---|---|
| `retentionRate`, `gradeDistribution`, `currentStreak`, `longestStreak`, `lastReviewedAt` | Projection A (`myFlashcardStats`) | GIỮ — retention lên headline "Trí nhớ"; streak+lastReviewed đẩy vào "Thói quen" thu gọn |
| `dueToday`, `dueForecast` | Projection B (`myFlashcardReviewStats`) | GIỮ — 0-due REFRAME thành trạng thái tích cực "Đã ôn hết hôm nay" (positive empty-state), không phải số 0 chết |
| `masteryBreakdown` | Projection B | GIỮ nhưng DEMOTE — strip nhỏ, không phải block riêng to |
| `dailyActivity` (90d) | Projection A | GIỮ 1 viz DUY NHẤT (heatmap) — **BỎ bar-chart 14 ngày** (trùng) |
| `byDeck` (footprint) | Projection B `reviewByDeck` | REFRAME — xem "cần aggregate" bên dưới |

### Trần dữ liệu CHƯA khai thác (data CÓ THẬT, cần aggregate — KHÔNG đổi schema)
| Stat mới | Data nằm đâu | Effort |
|---|---|---|
| **Leech cards** — thẻ hay grade Again nhất | `flashcard_review_events.grade=0` count per `flashcard_card_id`, join card→deck→course scope | aggregate-BE |
| **Tag yếu nhất** — tag retention thấp nhất | `flashcard_review_events ⋈ flashcard_cards.tags`: recalled(grade≥2)/total group by tag | aggregate-BE |
| **Deck theo độ-nhớ** — retention per deck (yếu nhất trước) | `flashcard_review_events ⋈ card→deck`: recalled/total group by deck (thay footprint) | aggregate-BE |
| **Retention trend** — "đang cải thiện?" | `flashcard_review_events` recalled/total per VN-day (như `dailyReviewCounts` nhưng retention) | aggregate-BE |

**Ràng CQRS ([[be:cqrs-no-inline-aggregate]]):** 3-4 aggregate này KHÔNG viết inline trong service — fold vào `value` jsonb của projection (Projection A user-global cho leech/tag/trend nếu muốn cross-course; HOẶC Projection B enrollment-scope cho course-scoped — apply-spec quyết grain, ưu tiên COURSE-scope vì tab nằm trong 1 khóa). CDC listener đã subscribe `flashcard_review_events`/`flashcard_review_sessions` sẵn — chỉ thêm key vào fold, không listener/migration mới.

## Flow + shell (KHÔNG đổi route/tab — chỉ đổi NỘI DUNG + THỨ TỰ trong tab stats)
Shell giữ nguyên: study-mode overview → nested `TabsCard` (Ôn tập/Lịch sử/Thống kê) → `FlashcardReviewStats` là pane. Cột đọc `mx-auto max-w-*`, mọi fetch qua `AsyncContent` (giữ gate `totalReviewed < 5` → EmptyState mời ôn).

## Zones (thứ tự MỚI, dẫn bằng outcome/action)
1. **HERO — "Cần ôn lại ngay"** (block: `SectionCard` accented / `LabeledCard` + `SurfaceListCard`):
   - Top ~5 leech cards (thẻ hay quên) — mỗi row: front snippet + số lần quên + deck; hover=underline, click → mở đúng deck đó ôn (mirror byDeck row idiom).
   - + 1 dòng "Chủ đề yếu nhất: {tag} · {retention}%".
   - **CTA primary "Ôn ngay"** → start 1 phiên review chỉ gồm leech cards (tái dùng mode "due"/cardIds subset đã có ở `useStartFlashcardReviewSession`; hoặc mở deck yếu). Phễu KHÓA (fair-monetization: nudge học).
   - State rỗng (chưa có leech / mới học): ẩn hero này, KHÔNG để card rỗng chết.
2. **"Trí nhớ"** (`SectionCard`): `retentionRate` headline số lớn màu-theo-ngưỡng + `ProgressMeter` + **mini trend line** retention-over-time ("đang cải thiện?") + `SegmentBar` grade distribution. (retention/grade = sẵn; trend = aggregate-BE.)
3. **"Khối lượng"** (`SectionCard`): `dueToday` — **0 → positive** "Đã ôn hết hôm nay 🎉, quay lại mai" (dùng icon check success, KHÔNG số 0 to) — else số thẻ + `dueForecast` mini-bar 7 ngày.
4. **Theo bộ thẻ — theo ĐỘ NHỚ** (`LabeledCard frameless` → `SurfaceListCard`): xếp deck YẾU nhất (retention thấp) trước, mỗi row retention% + CTA vào ôn. (aggregate-BE thay footprint.)
5. **"Thói quen" (thu gọn, cuối trang)** (`LabeledCard`): streak chip + `longestStreak` + heatmap 90 ngày (1 viz) + `lastReviewedAt` caption + `masteryBreakdown` strip nhỏ. Demote hẳn — đây là phụ, không phải điểm chính.

## State matrix + lens
- **Rỗng toàn cục** (`totalReviewed < 5`): EmptyState "ôn vài thẻ để thấy thống kê" + CTA vào ôn (giữ nguyên) — không ngõ cụt.
- **Có data nhưng 0 leech / 0 due**: hero leech ẩn; "Khối lượng" thành trạng thái caught-up tích cực (không phải card rỗng).
- **HONEST**: mọi số THẬT (leech = số Again thật, retention thật) — không fake. Hero là nudge HỌC (ôn thẻ yếu), không dark-pattern.

## Block briefs (element-aware — block THẬT)
- `SectionCard` / `LabeledCard` (`frameless` cho list) · `SurfaceListCard` + `SurfaceListCardRow` (leech list + deck list, `hover="underline"`, onPress→router.push) · `ProgressMeter` · `SegmentBar` (grade + mastery) · `MetricCard`/`SectionCard` headline · heatmap = CSS grid thuần (đã có, KHÔNG block canonical — giữ) · recharts LineChart cho retention-trend (đã dùng recharts BarChart, cùng lib) · HeroUI `Chip`/`Button`. KHÔNG hand-roll primitive mới.

## Files to touch
**BE (trước):**
- Projection service (`UserFlashcardStatsProjectionService` và/hoặc `UserFlashcardCourseStatsProjectionService` `src/modules/bussiness/projections/user-flashcard-*/`): fold thêm vào `value` jsonb: `leechCards` (top N cardId+forgotCount+deckId), `weakTag` (tag+retention), `deckRetention` (per-deck recalled/total), `retentionTrend` (per-day recalled/total). Types `types/index.ts` mirror.
- `my-flashcard-review-stats` query (`src/features/api/core/graphql/queries/flashcard/my-flashcard-review-stats/`): thêm field response + map từ projection (point-read, KHÔNG scan inline). `graphql-types/response.ts` + service + domain `types/index.ts`.
- Verify runtime THẬT + introspection field mới.
**FE (sau):**
- `query-my-flashcard-review-stats.ts` + `types/`: select field mới.
- `src/components/features/learn/Flashcards/FlashcardReviewStats/index.tsx`: dựng lại 5 zone theo thứ tự trên; bỏ bar-chart 14d; reframe 0-due; leech hero + CTA; deck theo retention.
- Có thể cần start-review-with-cardIds cho "Ôn ngay leech" — tái dùng `useStartFlashcardReviewSession` (đã có `mode`/cardIds; nếu cần start với cardIds tuỳ ý ngoài deck → cân nhắc mở rộng nhẹ, apply-spec quyết).
- i18n `flashcard.review.*` (vi+en): key mới (leechHeroLabel, forgotCount, weakTagLabel, reviewNowCta, caughtUpTitle/Hint, retentionTrendLabel, deckByRetentionLabel...).

## Ma trận build
- `render-là-xong`: reframe 0-due, bỏ chart 14d, đổi thứ tự zone, retention→headline, streak/mastery→demote (0 BE).
- `aggregate-BE`: leechCards, weakTag, deckRetention, retentionTrend (4 fold mới vào projection value + expose).
- `đổi-schema`: KHÔNG có (thầy chốt trong scope aggregate-BE).

## Verify plan
- tsc/eslint sạch 2 repo; BE runtime + introspection field mới; docker psql đếm tay 1 case leech/retention khớp.
- Browser: tab Thống kê → hero leech + CTA hoạt động, 0-due hiện caught-up, deck theo retention yếu-trước, thói quen thu gọn; mobile không vỡ.

## Prototype
Visual before/after: show_widget `flashcard_review_stats_redesign` (inline, 2026-07-13) — đã duyệt direction "Full". (Không dựng :8080 riêng — before/after đủ rõ + thầy đã chốt scope.)
