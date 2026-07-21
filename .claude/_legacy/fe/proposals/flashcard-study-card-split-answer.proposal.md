# Proposal — Flashcard study card: tách đáp án ra card riêng + arc màu theo vai trò

> Nối tiếp đợt "de-phèn" (RatingBar pro-tile + FlipCard viền + section rule — đã apply). Thầy chỉ trên màn quiz thật (2026-07-12): **(1) "bỏ phần đáp án ra khỏi card"** — câu hỏi + đáp án đang CHUNG 1 card (reveal-below), tách thành 2 surface; **(2) "render đúng bảng màu như ở trên"** — arc-section Giải pháp/Trade-off tô màu semantic đúng mockup, không rule trung tính. Mockup `show_widget` (flashcard_answer_split_and_arc_colors) = đích thị giác, thầy duyệt.

## Flow + shell (job → shell)
Surface HỌC/ÔN 1 thẻ (work-surface, KHÔNG data-page) — 3 khối XẾP DỌC, mỗi khối 1 surface card RIÊNG:
1. **Card câu hỏi** — eyebrow "Câu hỏi" + câu hỏi canh trái. Luôn hiện.
2. **[Reveal] Card đáp án** — eyebrow "Đáp án" + arc-sections. **HIỆN sau khi bấm "Xem đáp án"** (giữ retrieval-practice: cam kết trước khi thấy). Là card RIÊNG bên dưới, KHÔNG bung trong card câu hỏi.
3. **RatingBar** — chấm SM-2 (chỉ hiện sau khi lộ đáp án).

→ `FlipCard` (blocks/cards/FlipCard) hiện gộp front+back-reveal trong 1 card → **KHÔNG còn hợp**: tách thành (a) card câu hỏi + (b) reveal control + (c) card đáp án riêng. Áp NHẤT QUÁN cho cả 3 consumer FlipCard (QuizSession fallback path ~1131, DueReview, FlashcardReviewer) + path cloze QuizSession (~1210 câu hỏi / ~1379 đáp án — đã 2 card riêng, chỉ cần khớp da).

## Cơ chế MÀU arc-section (quyết định cốt lõi — chốt hỏi thầy)
Map màu theo **VAI TRÒ semantic**, keyed trên nhãn CANONICAL (SSOT `.claude/docs/rules/flashcard-answer.md` §2, vi+en), fallback trung tính — KHÔNG position/rainbow:

| Nhãn (vi / en) | Vai trò | Màu (rule trái + nhãn) |
|---|---|---|
| Chốt / TL;DR · Giải pháp / Solution | câu trả lời chính | `success` (xanh) |
| Trade-off | đánh đổi/căng thẳng | `warning` (vàng) |
| Bẫy thường gặp / Common pitfall | tránh sai | `danger` (đỏ) |
| Cơ chế / How it works · Đào sâu / Go deeper | chi tiết | neutral (`border-default`, nhãn `text-muted`) |
| (không khớp — freeform) | — | neutral (fallback, KHÔNG bịa màu) |

- Impl: `reuseable/MarkdownContent/map.tsx` `ArcSection` — extract label text (`getNodeText(children[0])`) → normalize (lowercase, bỏ dấu phụ) → tra `ARC_ROLE_COLOR` → set `border-l-<role>` + nhãn `text-<role>`.
- ⚠️ **ArcSection DÙNG CHUNG mock-interview answers** → map này áp cả kia. OK vì mock-interview dùng cùng bộ arc-label (interview rules) → coloring nhất quán, không lệch.

## Block briefs (element-aware)
- Card câu hỏi / đáp án = surface card bordered (`rounded-2xl border border-default bg-surface`, da §0/§3g richer đã chốt) — cân nhắc dùng `LabeledCard` (label "Câu hỏi"/"Đáp án" ngoài) hoặc div bordered + eyebrow.
- Reveal control = `components/button` variant outline "Xem đáp án" (giữ như hiện tại, chỉ đổi vị trí: giữa 2 card).
- RatingBar = giữ nguyên (đã pro-tile + `PressableCard hoverVariant="lift"`).
- Arc màu = sửa trong ArcSection (map.tsx).

## Files to touch
- `src/components/blocks/cards/FlipCard/index.tsx` — refactor: tách front/back thành 2 surface HOẶC deprecate cho flow này (feature tự compose 2 card). Quyết ở apply.
- `src/components/features/learn/Flashcards/QuizSession/index.tsx` — path fallback (~1126) + cloze (~1200): câu hỏi/đáp án 2 card riêng + reveal giữa.
- `src/components/features/learn/Flashcards/DueReview/index.tsx` + `FlashcardReviewer/index.tsx` — cùng cấu trúc 2-card.
- `src/components/reuseable/MarkdownContent/map.tsx` — `ArcSection` màu theo vai trò + `ARC_ROLE_COLOR` map.
- Skeleton mirror (QuizSessionSkeleton/DueReviewSkeleton/FlashcardReviewerSkeleton) — khớp 2-card.

## Verify plan
tsc + eslint sạch; preview :3000 (thầy login) — thẻ 2 card tách rời, đáp án hiện sau "Xem đáp án", Giải pháp xanh / Trade-off vàng / Bẫy đỏ / Cơ chế trung tính; rating pro-tile. Prototype ref: `show_widget` flashcard_answer_split_and_arc_colors.

## Canon sẽ cập nhật (apply)
`card.md §3g` (FlipCard reveal-below → tách 2 card; đính chính "answer trong cùng card"), + ruling mới cho arc-section màu-theo-vai-trò (richtext.md / rules-concepts).
