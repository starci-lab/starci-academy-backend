# Plan — Freemium "đọc mở" qua enrollment `isPurchased` (2026-06-18)

> Product/BE brainstorm (KHÔNG code). Thầy: *"ai cũng xem preview được nhưng có giới hạn — không challenges,
> không project; được ĐỌC và lưu DB là đã đọc (= lưu enroll, thêm `isPurchased=true`) — để marketing."*

## 0. Ý tưởng cốt lõi (reframe chiến lược)
- **Nội dung (đọc) = PHỄU marketing, miễn phí.** **Thực hành (challenges + personal-project) = SẢN PHẨM bán.**
- Mọi người đăng nhập → đọc bài full + **tiến độ "đã đọc" lưu DB** → tạo **enrollment `isPurchased=false`** (lead ấm).
- Mua → flip **`isPurchased=true`** → mở khóa challenges + project. Refund → về `false` (giữ tiến độ đọc, khóa lại
  thực hành). → 1 row enrollment, 1 vòng đời; tiến độ vốn đã treo trên enrollment.

## 1. Model hiện tại (grounded)
- `EnrollmentEntity` (`enrollments`, UNIQUE user+course) = **đã-mua**: tạo bởi **enroll processor** sau transaction
  Succeeded; mang `pricingPhase` (NOT NULL) + slot/phase advance + personal-project state (`personalProjectGithubUrl/Branch`,
  `taskPlanStatus`, `tasksCompletedAt`, `userMilestoneTasks`) + GitHub team grant.
- **Gate truy cập** = cache SET enrolled-courses/user (`checkEnrollment`/`invalidateEnrolledCourses`), dùng ở: content,
  my-course-outline, submit-challenge, personal-project review, pin-capstone, … → **"enrolled" hiện ĐỒNG NGHĨA "đã mua".**
- Premium content: hiện truncate/blur body `isPremium` cho người chưa-enroll ("đọc thử").

## 2. Thay đổi (model)
- **Thêm cột `EnrollmentEntity.is_purchased boolean NOT NULL default false`** (`isPurchased`). + migration.
- **`pricingPhase` cho free-enroll:** thêm `PricingPhase.Preview` (hoặc cho nullable). Free row KHÔNG đụng slot/phase.
- **2 đường tạo enrollment:**
  | | Free (mới) | Paid (hiện có) |
  |---|---|---|
  | Trigger | auto khi user đăng-nhập đọc bài lần đầu (hoặc nút "Đọc miễn phí") | transaction Succeeded → enroll processor |
  | `isPurchased` | `false` | `true` |
  | Slot/pricing-phase advance | **KHÔNG** | có |
  | GitHub team grant | **KHÔNG** | có |
  | personal-project init | KHÔNG | có |
- **Đường nâng cấp free→paid (GOTCHA quan trọng):** enroll processor hiện gặp `existingEnrollment` thì **SKIP**
  (`return`). Phải sửa: nếu row tồn tại & `isPurchased=false` → **UPDATE `isPurchased=true` + CHẠY các post-step
  paid-only** (đếm slot, advance phase, github grant, project init) đúng một lần. Không thì người đọc-free rồi mua sẽ
  không bao giờ được mở khóa.
- **Refund:** set `isPurchased=false` (đã có plumbing revoke github) — giữ row + tiến độ đọc; lock lại thực hành.

## 3. Gate audit (RỦI RO LỚN NHẤT — "enrolled" ≠ "đã mua" nữa)
Mọi chỗ dùng "enrolled" để gate **tính năng PAID** phải đổi sang **`isPurchased=true`**; chỗ gate **ĐỌC** thì nới cho
mọi enrollment (kể cả free). Cần rà & phân loại từng call-site:
| Tính năng | Gate mới | Ghi chú |
|---|---|---|
| Đọc bài (content/my-course-outline) | **enrolled (free OK)** | full body, kể cả lesson `isPremium`? → DECISION D4 |
| Đánh dấu đã đọc / progress | enrolled (free OK) | đã có (content status/activity) |
| **Submit challenge** | **isPurchased** | `submit-challenge-submission.handler` |
| **Personal-project** (submit/review/pin) | **isPurchased** | enrollment + project state |
| AI-lab eval / flashcards / mind-map / foundations / leaderboard | **DECISION D1** | free để dày phễu? hay gate vài cái? |
| GitHub private repo team | isPurchased | chỉ paid |

→ **Phải grep & sửa TẤT CẢ ~20 call-site `checkEnrollment`** (đã liệt kê khi grep) + cache: có thể tách 2 set
("enrolled-any" vs "purchased") hoặc cache map courseId→isPurchased.

## 4. Phễu & marketing (cái "tại sao")
- **Lead ấm = enrollment `isPurchased=false` + có read activity.** Segment được: đọc N bài / đọc gần đây / đọc xong
  module nhưng chưa mua → **upsell** (email Brevo đã có + [[engagement loyalty discount]] đã có → giảm giá cho người
  chăm đọc).
- **Conversion mechanic:** free đọc → chạm challenge/project → paywall *"Mở khóa thực hành"* → mua. Sunk-cost (đã đọc
  X%, tiến độ) đẩy chuyển đổi.
- **Metric mới:** #đọc-chưa-mua, read-depth trước khi mua, time-to-convert, conversion theo module.
- Honest pricing: bán **thực hành chấm điểm + capstone + private repo + standing**, không bán chữ → marketing mạnh, đúng đạo.

## 5. Hướng + đề xuất chốt
- **H1 (đề xuất) — `isPurchased` trên enrollment (đúng ý thầy).** 1 row, refund=downgrade, progress sẵn treo. Rủi ro
  = gate audit + upgrade-path; nhưng sạch & marketing-ready. ✅
- **H2 — bảng `course_reads` tách rời enrollment.** Đọc-free không tạo enrollment, chỉ log read. Ít đụng gate cũ
  nhưng **2 nguồn sự thật** (read vs enroll), khó segment "lead", trùng tiến độ → loại.
- **H3 — enum `accessTier: preview|full`** thay boolean. Future-proof (membership-granted) nhưng giờ thừa → giữ boolean
  `isPurchased`, nâng enum sau nếu cần.

## 6. Quyết định (thầy chốt 2026-06-18)
- **D1 — Free gồm:** đọc bài (non-premium) · mind-map · foundations · **leaderboard (xem)** · **flashcard mở ~20%**
  (teaser). Challenges + personal-project + flashcard-full + kiếm-XP = **paid** (`isPurchased`).
- **D2 → reframe SEO:** thầy muốn trang **SEO `content/[id]` plain, full bài, KHÔNG dính sidebar** làm cửa phễu cho
  khách vãng lai → xem §8.
- **D3 — Lesson `isPremium` VẪN CẦN MUA** (giữ 2 tầng nội dung; free chỉ đọc lesson thường, premium truncate như nay).
- **D6 — Free VẪN kiếm XP (thầy chốt):** đọc bài grant XP cho free-enroll (đã có `writeXpHistory` lúc read) → leo
  leaderboard → **tâm lý sunk-cost** ("đã có điểm/hạng, tiếc, mua nốt mở thực hành"). KHÔNG strip XP của free.
  XP từ challenge/project vẫn paid-gated.
- (mở) Free-enroll trigger AUTO khi đọc lần đầu; `pricingPhase` free = thêm `Preview` hoặc nullable — chốt khi build.

## 7. Map gate theo D1 (free vs paid)
| Surface | Free (isPurchased=false) | Paid |
|---|---|---|
| Đọc lesson thường | ✓ full | ✓ |
| Đọc lesson `isPremium` | ✗ (truncate + CTA mua) | ✓ |
| Mind-map · Foundations | ✓ | ✓ |
| Leaderboard | ✓ xem **+ kiếm XP** | ✓ |
| Kiếm XP | ✓ **từ ĐỌC bài** (sunk cost) | ✓ + từ challenge/project |
| Flashcards | ✓ **~20% deck** (teaser) | ✓ full + review |
| Challenges (submit/grade) | ✗ paywall | ✓ |
| Personal-project | ✗ paywall | ✓ |

## 8. Trang SEO công khai `content/[id]` (cửa phễu vãng lai) — ĐÃ CÓ, cần nâng
**Đã tồn tại:** route `/[locale]/contents/[contentId]` → `layouts/learn/ContentDetail` = bài plain
(`max-w-4xl p-6`, header + `MarkdownContent` full body), **ngoài learn shell, KHÔNG sidebar**. Dùng
`useQueryPublicContentSwr` (public query đã bỏ enroll-guard + truncate body premium — [[premium-content-paywall-feature]]).
→ **Trả lời thầy: ĐƯỢC, và đã có sẵn khung.** Nhưng hiện **chưa "SEO thật"** (yếu) vì:
- **`"use client"` + SWR** → body KHÔNG server-render vào HTML → crawler/social thấy rỗng. **Cần SSR** (Server Component
  fetch public content, render thẳng HTML).
- **Thiếu `generateMetadata`** (title/description/OG/Twitter/canonical per bài) → không index/share đẹp.
- **Thiếu JSON-LD** (`Article`/`LearningResource`) → mất rich result.
- **Heading render là `<div>`** (renderer `MarkdownContent` map h2/h3→div) → mất semantic `<h_>` cho SEO. Trang SEO nên
  render heading thật.
- **Thiếu sitemap** liệt kê mọi `/contents/<id>` (+ chỉ index lesson FREE/non-premium).
**Vai trò trong phễu:** vãng lai vào `/contents/[id]` (SEO, plain) → đọc phần free → CTA *Đăng nhập đọc tiếp / Vào học* →
auto free-enroll (`isPurchased=false`) → vào learn shell. Premium/challenge → paywall mua. (= D2: anonymous landing = SEO page.)
- **Lift:** (a) SSR body + `generateMetadata` + JSON-LD + real `<h_>`, (b) CTA login/enroll cuối phần free, (c) sitemap,
  (d) link nội bộ (related lessons) cho SEO. Route/UI khung KHÔNG phải dựng lại.

## 7. Đừng-vỡ
- Free-enroll **TUYỆT ĐỐI không** đụng slot/pricing-phase (không thì người đọc-free làm nhảy giá khóa cho người mua).
- Upgrade free→paid phải chạy post-step paid-only **đúng 1 lần** (idempotent) — sửa enroll processor `existingEnrollment` branch.
- Cache enrolled-set hiện trả boolean "có/không" → phải phân biệt free vs paid (không thì challenge mở cho free).
- Đồng bộ với [[premium-content-paywall-feature]] (đọc thử) + [[community-membership-plan]] (membership ≠ free-read).

→ Thầy chốt D1–D5 → tách task: (1) migration `is_purchased`, (2) free-enroll path + auto-trigger, (3) upgrade
free→paid ở processor, (4) gate audit đổi `isPurchased`, (5) cache 2-set, (6) FE paywall "mở khóa thực hành" + marketing query lead.
