# Proposal — Flashcards "Hỏi nhanh" (InterviewSession) setup enrich + per-phase shell width

- **Status:** 🔨 IN-PROGRESS (code xong, browser CHƯA verify — [[feedback-dont-mark-done-without-real-verify]], không tự nâng ✅ nữa) · **Chốt:** thầy duyệt prototype 2026-07-08
- **Verify:** `tsc --noEmit` exit 0 (repo FE) · `eslint` sạch (41 lỗi baseline pre-existing, KHÔNG liên quan file đã sửa) · browser click-through **CHƯA verify** — Preview MCP không giữ được server FE khi cwd session ở repo backend ([[preview-tool-cross-repo-workspace-limitation]] trong memory), cần session rooted ở `C:\Repositories\starci-academy` để soi bằng mắt.
- **Prototype:** [`../prototypes/flashcard-interview-flow.html`](../prototypes/flashcard-interview-flow.html) (element-aware, 5 màn: Setup · Active·cloze · Active·rate · Recap · Empty)
- **Feature doc:** flashcard-spaced-rep-ux (memory) — active/recap 6-zone recap đã được rework 2026-07-05, KHÔNG động vào; scope lần này = setup + shell width.
- **Feedback fix (2026-07-08, sau khi thầy soi ảnh):** Zone 2 (config) thiếu label cấp-zone (khác Zone 1 có "Tiến bộ") → đổi `Card` bare → `LabeledCard label="Cấu hình luyện"` (tái dùng key i18n `masteryTitle` đã mồ côi sau khi bỏ mastery-block tự chế, đổi nội dung thành "Cấu hình luyện"/"Practice setup"). Gap giữa tabs và nội dung (`Flashcards/index.tsx` outer wrapper) `gap-10`→`gap-6` theo thang spacing 0/2/3/4/6.
- **Bug phát sinh khi soi (2026-07-08, KHÔNG do thay đổi layout hôm nay — pre-existing):** click "Bắt đầu luyện" → `FLASHCARD_DECK_NOT_FOUND_EXCEPTION` cho 1 deck (network tab), rồi UI hiện nhầm "Chưa có thẻ ở cấp độ này" (`EmptyState`). Gốc: `flashcardDecksByCourse` (setup screen) đọc **Postgres**, còn `flashcardDeck(id)` (dùng bởi `startSession` để kéo full-card mỗi deck) đọc **Elasticsearch** qua `FlashcardDeckReadService.getById` (`flashcard-deck.service.ts:169-198`, tài liệu chính module đã ghi rõ 2 nguồn khác nhau) — 1 deck có trong DB nhưng chưa index vào ES (data/infra gap, có thể xem `src/modules/init/synchronizers/elasticsearch-synchronizer/builder/flashcard-deck.service.ts` + reconcile-synchronizer để re-sync, KHÔNG tự chạy vì đây là thao tác vận hành). Code-side bug thật (đã fix): `startSession`'s `Promise.all` không catch lỗi từng deck → 1 deck fail là cả session rỗng SAI THÔNG ĐIỆP (nói "đổi cấp độ" trong khi lỗi là backend). Fix: `Promise.allSettled` per-deck + track `anyDeckFailed`; pool rỗng VÌ fail (không phải vì lọc level thật) → `buildError` state → `ErrorContent` (title/description mới `sessionLoadErrorTitle/Description` + nút "Thử lại" gọi lại `startSession`), tách khỏi `EmptyState` "Chưa có thẻ ở cấp độ này" (case lọc-level ra rỗng thật).
- **Round 3 (2026-07-08, thầy soi tiếp + bắt lỗi quy trình):** 2 bug mới bắt ngay khi test tay dù đã đánh ✅ DONE — xem [[feedback-dont-mark-done-without-real-verify]] cho bài học quy trình.
  1. **Width sai:** `isWide = phase==="active"` nới rộng CẢ building/error/empty sub-state (không chỉ cloze UI thật) — kể cả màn `ErrorContent` cũng bị nới sai. Fix: đổi tín hiệu từ `onPhaseChange(phase)` → `onWorkSurfaceChange(isWorkSurface)` với `isWorkSurface = phase==="active" && !building && !buildError && Boolean(card)` — chỉ nới khi THẬT SỰ đang hiện cloze/flip UI.
  2. **i18n key `configLabel` mất** — bị 1 session khác chạy song song ghi đè `vi.json`/`en.json` (file dùng chung), next-intl hiện literal key ra UI. Đã thêm lại + grep-verify còn sống.
  - tsc/eslint sạch lại. Status GIỮ 🔨 (không tự nâng ✅ khi browser chưa verify thật).
- **Đính chính gap (2026-07-08, thầy: "gap-10 cũng được"):** dòng #7 ở trên đổi `gap-10`→`gap-6` là **SAI** — `fe/foundations/gap.md` đã ghi rõ named exception **"PageHeader → nội dung dưới = gap-10"**, đáng lẽ phải tra trước khi đổi theo feedback ảnh (bài học: đừng chỉnh spacing theo cảm giác từ 1 câu feedback ngắn mà không tra `foundations/gap.md` trước). Fix ĐÚNG (không chỉ revert mù): tách 2 tầng — outer wrapper `PageHeader` → content = `gap-10` (giữ nguyên đúng canon), rồi bọc {MobileNav, SegmentedControl, body} vào 1 `<div className="flex flex-col gap-6">` làm 1 CỤM content — khớp chính xác pattern đã tả ở `gap.md` §"Course-home/stack dọc" (gap-6 CHIA vùng, gap-3/nội dung TRONG vùng, PageHeader luôn gap-10 riêng).

## Bối cảnh / phát hiện gốc
Route `/courses/<slug>/learn/flashcards/interview` render `InterviewSession` (`src/components/features/learn/Flashcards/InterviewSession/index.tsx`) qua 3 pha `setup`/`active`/`recap`, tất cả bọc chung trong `Flashcards/index.tsx:78` — `<div className="mx-auto flex max-w-3xl flex-col gap-10">`. Hai vấn đề:

1. **Setup mỏng** — pha `setup` (dòng 445-551) dồn mastery-meter + config (mode/level) + CTA vào **1 `Card` duy nhất**, trong khi tab "Học thẻ" (sibling `mode=study`) có 3 khối tách bạch (`DueReviewHero` + `FlashcardStatsStrip` + `FlashcardDeckList`) nên nhìn giàu/cân đối hơn hẳn — cùng 1 page, 2 tab lệch cân thị giác.
2. **Pha `active` bị bó vào `max-w-3xl` dùng CHUNG với setup/recap** — đúng anti-pattern mà `layouts/surface-job-drives-layout.md` §Áp đầu đã ghi nhận ở Mock Interview (2026-07-07): 1 `phase` state-machine ép mọi pha vào cùng 1 shell, trong khi pha "làm-việc-tập-trung" (ở đây: cloze fill-blank + word bank) cần rộng hơn pha "quyết"/"kết-quả". Flashcards đã rail-less (`learn/layout.tsx:67-70`) nên nhẹ hơn case Mock Interview (không bị rail khoá thêm), nhưng câu cloze dài + word bank nhiều thuật ngữ vẫn lợi khi có nhiều bề ngang hơn.

## Flow + shell (job → shell, đổi theo pha)
| Pha | Job | Shell | Đổi gì |
|---|---|---|---|
| setup | quyết/nhập | centered `max-w-3xl` ([[centered-form-setup]]) | **GIỮ NGUYÊN width**, chỉ tách nội dung thành 3 zone |
| active | làm-việc-tập-trung | **rộng hơn `max-w-3xl`** (không cần 2-pane — task nhẹ) | width mới, 1 cột |
| recap | kết quả/debrief | centered `max-w-3xl` | không đổi (đã đúng chuẩn từ rework 2026-07-05) |

## Zones + block briefs (element-aware — tên block THẬT)
### Setup (3 zone tách khỏi 1 Card gộp)
- **Zone 1 — tiến bộ:** thay `ProgressMeter` tự chế (dòng 450-485) bằng **tái dùng `FlashcardStatsStrip`** (`src/components/features/learn/Flashcards/FlashcardStatsStrip/index.tsx`) — đã có `SegmentBar` (mastered/learning/new) + streak chip + retention caption, cùng SWR key với sibling tab (không thêm fetch). Parity ngay với "Học thẻ", không code mới.
- **Zone 2 — config:** giữ nguyên `FlexWrapButtonRadio` (mode + level, dòng 488-535), chỉ tách vào `Card`/`LabeledCard` RIÊNG (không chung Card với Zone 1) để 2 zone có ranh giới rõ.
- **Zone 3 — CTA:** giữ nguyên nút "Bắt đầu luyện" (dòng 538-547), đặt ngoài 2 Card trên (như bố cục hiện tại của trang `study`).

### Active (widen only — KHÔNG đổi cấu trúc cloze/word-bank/rating đã build)
- Route pha `active` render NGOÀI `mx-auto max-w-3xl` (bọc trong `Flashcards/index.tsx`) — ví dụ tách 1 wrapper riêng `phase === "active" ? "max-w-5xl" : "max-w-3xl"` hoặc để `InterviewSession` tự quyết width qua 1 prop điều hướng từ `Flashcards/index.tsx` (chi tiết kỹ thuật do apply quyết, miễn giữ đúng nguyên tắc: setup/recap hẹp, active rộng).
- KHÔNG chuyển sang 2-pane — task cloze fill-blank không cần workspace phụ, đủ 1 cột rộng hơn.

### Recap — KHÔNG ĐỘNG (đã 6 zone A-F từ rework trước, đúng chuẩn job "kết quả").

## Conversion lens (đã grounded từ code hiện có, không đổi hành vi)
- **CTA:** setup "Bắt đầu luyện" (1 primary) · recap Zone E "Đăng ký khoá học" (trial, primary) / Zone C weak-tags (enrolled, primary) — giữ nguyên logic điều kiện `enrollKnown && enrolled`.
- **Link:** recap Zone C weak-tag → lesson deep-link (`resolveTagHref`) · Zone D → AI Mock Interview khi `readiness.unlocked` — giữ nguyên.
- **Psych:** combo chip (streak), goal-gradient progress dots — giữ nguyên, không thêm số giả.
- **Honest:** không thêm scarcity/fake-count nào ở setup enrich (chỉ hiển thị số THẬT từ `FlashcardStatsStrip`/SWR có sẵn).

## State matrix (không đổi hành vi, chỉ xác nhận vẫn phủ đủ sau khi tách zone)
- Setup rỗng (chưa có deck nào) → nút "Bắt đầu luyện" `isDisabled` khi `totalCards === 0` (đã có, giữ).
- Active hết thẻ ở level đã chọn → `EmptyState` "Không còn thẻ ở cấp độ này" (đã có, giữ, chỉ theo width mới).
- Recap trial/enrolled toggle — giữ nguyên 6 zone hiện có.

## Files to touch
- `src/components/features/learn/Flashcards/index.tsx` — tách width theo `mode === "interview" && phase === "active"` (cần biết `phase` từ `InterviewSession` hoặc nâng `phase` state lên đây/qua URL nhỏ tương tự Mock Interview's `?phase=` nếu cần theo route).
- `src/components/features/learn/Flashcards/InterviewSession/index.tsx` — pha `setup` (dòng 444-552): xoá block mastery tự chế, chèn `<FlashcardStatsStrip />`, tách Card config riêng.
- Không đổi: `build-cloze.ts`, `parse-answer-keywords.ts`, `InterviewSessionSkeleton`, pha `active`/`recap` logic (chỉ đổi width bọc ngoài, không đổi JSX bên trong).

## Verify plan
- `tsc --noEmit` + `eslint` sạch (FE repo).
- Preview: `/courses/<slug>/learn/flashcards/interview` — soi Setup 3-zone thị giác cân với tab "Học thẻ"; bấm "Bắt đầu luyện" → active rộng hơn cũ, cloze/word-bank vẫn hoạt động y hệt; recap không đổi. Responsive mobile: Setup 3 zone stack, active vẫn 1 cột full-width.
