# Flashcard — business state map

Source: `src/modules/bussiness/flashcard/` (`flashcard-review.service.ts`,
`flashcard-deck.service.ts`, `flashcard-review-session.service.ts`,
`flashcard-quiz-session.service.ts`, `flashcard-due-review-session.service.ts`)
+ entities under `src/modules/databases/postgresql/primary/entities/flashcard-*.ts`
and `user-flashcard-review.entity.ts`. Resolvers: `src/features/api/core/graphql/
{mutations,queries}/flashcard/**` and `.../flashcard-decks/**`. One extra
mutation's logic (`startFlashcardQuizSession`) lives outside this domain, in
`src/features/api/core/graphql/mutations/flashcard/start-flashcard-quiz-session/
start-flashcard-quiz-session.handler.ts` — a CQRS handler the codebase
deliberately keeps small enough not to warrant its own domain service.

An interview-prep flashcard system with three study modes over the same card
pool (deck-review, quick-quiz, cross-deck due-review), all riding on one
SM-2 spaced-repetition scheduler.

## Entities

- **FlashcardDeckEntity** (`flashcard_decks`) — `title`, `difficulty`,
  `orderIndex`/`sortIndex`, owned by exactly one **CourseEntity**
  (`course` is `nullable: false` — see Finding #4, the code elsewhere assumes
  a course-less "global deck" can exist). Has many `cards`.
- **FlashcardCardEntity** (`flashcard_cards`) — `question`/`answer`/
  `explanation` (Markdown), `level` (junior/middle/senior/staff, nullable),
  `tags: string[]`, `isPremium` (documented as gating the answer behind
  enrollment "mirroring the content paywall" — see Finding #1, nothing
  actually enforces this).
- **UserFlashcardReviewEntity** (`user_flashcard_reviews`) — the CURRENT SM-2
  state for one `(user, card)` pair: `ease` (float, floor 1.3, starts 2.5),
  `intervalDays`, `repetitions`, `dueAt`, `lastReviewedAt`. Keyed by
  `enrollmentId` going forward (course-scoped review), with `userId` kept for
  a still-running re-key backfill (both nullable; a row predating the re-key
  may carry only `userId`). **No unique constraint exists on `(userId,
  flashcardCardId)` or `(enrollmentId, flashcardCardId)`** despite the
  entity's own doc stating "one row is upserted per (user, card)" — see
  Finding #1 in `findings.md`.
- **FlashcardReviewEventEntity** (`flashcard_review_events`) — append-only
  grade log (`grade`, `reviewedAt`, optional `sessionId`); the CDC source for
  the `user_flashcard_stats` projection (streak/retention/totals). Distinct
  from `UserFlashcardReviewEntity`, which only ever holds current state.
- **FlashcardReviewSessionEntity** / **FlashcardDueReviewSessionEntity** /
  **FlashcardQuizSessionEntity** — three separate resumable-draw tables (see
  Sessions below), never a single polymorphic table.

## The scheduler: SM-2 (`flashcard-review.service.ts`)

A card's SM-2 state is `{ease, intervalDays, repetitions}`. A brand-new card
(no review row) reads as `{ease: 2.5, intervalDays: 0, repetitions: 0}`
(`NEW_CARD_STATE`).

**Transition, on grading with `grade ∈ {0=Again, 1=Hard, 2=Good, 3=Easy}`:**

- **grade = 0 (Again)** → lapse: `repetitions → 0`, `intervalDays → 1`,
  `ease` **untouched** (classic SM-2 only adjusts ease on a successful
  recall, never on a lapse).
- **grade ≥ 1** → successful recall: `repetitions++`;
  `ease = max(1.3, ease + (0.1 - (3-grade)·(0.08 + (3-grade)·0.02)))`;
  `intervalDays = repetitions==1 ? 1 : repetitions==2 ? 6 :
  round(prevInterval · ease)`.
- `dueAt = now + intervalDays days` in every branch.

A card is **due** when it has no review row yet, OR its `dueAt <= now()`.
`previewIntervals()` runs the same pure function for all four grades without
persisting, powering the rating-button preview (`nextIntervals`) shown before
the learner picks a grade.

**XP invariant**: `reviewFlashcard` grants `FLASHCARD_FIRST_REVIEW_XP` (2 XP)
**only** the first time a user ever grades a given card (the `!existing`
branch) — every repeat grade of the same card grants 0. The grant goes
through `writeXpHistory` keyed on `(source=FlashcardFirstReview,
refId=review.id)`, which is idempotency-safe against a *replay of the same
row* but not against *two rows being created for the same card* (Finding #1).

## The due-queue split (`listDue`)

"Due today" is deliberately split into two buckets rather than one lump sum
(the historical "449 bug": a fresh viewer saw their *entire* never-reviewed
backlog as "due"):

- **overdue** = has a review row AND `dueAt <= now()` — shown first, oldest
  due first.
- **new** = no review row yet — capped to `DAILY_NEW_LIMIT` (20) for the
  headline count, though `newTotalCount` (uncapped) is also returned.
- `dueCount = dueReviewCount + newCount` is the actionable "do today" number;
  the new pool naturally refills as new cards get reviewed and drop into
  "overdue" state.

**Keying differs by page context**: on a course page the review-row join
keys by `enrollmentId` (the intended long-term anchor for per-course
progress); with no `courseId` (the cross-course dashboard queue) it keys by
`userId` instead — enrollment is **never required** to review, so a
non-enrolled trial viewer still gets a due queue (every card simply reads as
NEW until they grade it).

## Sessions: three independent resumable-draw flows

All three share the same shape (`start` → `sync` (periodic) → `complete`,
each ownership-scoped) but persist to **separate tables**, are scoped
differently, and disagree on whether they grant XP:

| Session | Table | Scope | Grades via | Grants XP itself? |
|---|---|---|---|---|
| Deck-review ("Học thẻ") | `flashcard_review_sessions` | one deck | `reviewFlashcard` per card | No — `xpEarned` is a client-reported bookkeeping snapshot only |
| Cross-deck due-review | `flashcard_due_review_sessions` | one enrollment, many decks | `reviewFlashcard` per card | No — same as above |
| Quick-quiz ("Hỏi nhanh") | `flashcard_quiz_sessions` | one enrollment (course-wide) | its own `completeFlashcardQuizSession` scoring | **Yes** — the only one of the three with a real XP grant |

**Lifecycle** (all three): `in_progress` → (**start** on the SAME
enrollment[+deck]) retires the PRIOR `in_progress` row to `abandoned` →
`sync` updates position/progress in place, no-ops silently if not
`in_progress` or not owned → `complete` flips to `completed`,
`WHERE status != "completed"` (deliberately loosened from `status =
"in_progress"` on 2026-07-12 after a real incident: a row raced to
`abandoned` by a concurrent `start()` used to silently match zero rows on
`complete`, permanently stranding a finished session that a page refresh
would re-enter instead of showing the recap).

A session with no cron sweep past its wall-clock duration is not a 4th
persisted status — every reader derives "timed out" at READ time
(`status === "in_progress" && createdAt + DURATION < now`); the row only
actually flips to `abandoned` once the same enrollment starts a fresh draw.

**Quick-quiz scoring is server-derived, never client-trusted**: the client
sends a per-card `{cardId, correctBlanks, totalBlanks}` breakdown;
`coverage` = average of each card's own ratio, computed server-side. Reward
= `min(dailyHeadroom, MAX_XP_PER_SESSION=15, round(coverage · cards · 3))`,
where `cards` is clamped to at most 10 answers even if the client sends more.
A `DAILY_QUIZ_XP_CAP` of 60 XP per `(user, course)` per **VN calendar day**
(`Asia/Ho_Chi_Minh`) bounds total farming even across unlimited sessions —
see Finding #3 for a race in how that cap is enforced.

**Due-review "chỉ thẻ cần ôn" mode**: `start({mode: "due"})` narrows the
caller's requested `cardIds` down to only the ones actually due (no review
row, or past `dueAt`) — unless that filter would leave an empty set, in
which case the full requested set is kept (a defensive floor; the FE is
expected to already disable this mode when nothing is due).

## Deck reads (`flashcard-deck.service.ts`)

`listByCourse` reads from Postgres (ordered by `sortIndex`); `getById` reads
from a per-locale Elasticsearch index instead (the ES sync builder embeds the
same card/translation graph). Both can annotate per-viewer state when a
`userId` is given: `listByCourse` adds `dueCount`/`masteredCount`
(`repetitions >= 2`) per deck; `getById` adds `nextIntervals` per card. All
annotation here keys by `userId` (never `enrollmentId`) even on a
course-scoped read — unlike `listDue`, which switches keying by context.

## Invariants

1. **A card's "current" scheduling state is one row** in
   `UserFlashcardReviewEntity` per `(user, card)` — **not actually enforced**
   at the DB level (Finding #1); the application code assumes it everywhere
   (`findOne` without an `ORDER BY`/uniqueness guarantee to pick "the" row).
2. **Ease never drops below 1.3** (`EASE_FLOOR`), and is left untouched on a
   lapse (grade 0).
3. **First-review XP is granted at most once per `(user, card)`** — in
   practice, only as safe as invariant #1 (Finding #1 breaks this too).
4. **A learner never has two `in_progress` sessions of the same kind+scope at
   once** — enforced by `start()` retiring the prior row before inserting,
   for all three session tables.
5. **Hidden hint hindsight**: `getHint` tries the requested locale, then
   falls back to English; a document with an empty `hint` string reads as "no
   hint", not as an empty-but-present one.
6. **A deck's `course` FK is `NOT NULL`** — despite three separate comments
   across `flashcard-review.service.ts` and `flashcard-quiz-session.service.ts`
   describing a "global deck with no course" as a live, handled case (Finding
   #4). If that branch is ever actually reached in production it means the
   schema invariant was violated some other way, not that the "global deck"
   feature works.
7. **Reference-quality answers never leak through the catalog read** —
   `back`/`answer` come straight off the entity with **no premium/entitlement
   filter of any kind** (Finding #1) — this is the mirror-image of invariant
   #7 in the `coding` domain's `business.md`, where the equivalent leak is
   actually closed.

## Cross-domain notes

- `FlashcardReviewService` depends on `UserService.resolveOrCreateTrialEnrollment`
  (from `../user`) to key review rows by enrollment; a card graded on a
  global (course-less) deck leaves `enrollment` unset — see invariant #6.
- `FlashcardQuizSessionService` calls into `UserFlashcardStatsProjectionService`
  (from `../projections/user-flashcard-stats`) for the "AI Mock Interview
  readiness" cross-link, and into `ContentRagRetrievalService` (RAG) to
  resolve a weak tag's "review this lesson" deep link — the old
  deck→content/module many-to-many was removed in favor of semantic search.
