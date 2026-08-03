# Flashcard — findings

Ranked most severe first. Axes per `starci-be-deepscan-map`: naming, jsdoc,
business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [security] Premium flashcard answers carry no entitlement gate at all
`FlashcardCardEntity.isPremium`
(`src/modules/databases/postgresql/primary/entities/flashcard-card.entity.ts:184-201`)
is documented as: "the first ~20% of each deck's cards are free; the rest are
premium... locked for you (the answer is withheld unless the viewer is
entitled), mirroring the content paywall." No code anywhere in
`src/modules/bussiness/flashcard/` reads `isPremium` or checks enrollment
before returning `question`/`answer`/`explanation`. Compare
`src/features/api/core/graphql/queries/contents/content/content.handler.ts:167-184`,
which has a real `isEntitled()` check + `lockPremiumContent()` for the
equivalent `ContentEntity.isPremium` flag — the pattern this JSDoc says
flashcard "mirrors" simply does not exist here. The resolvers that serve card
data (`flashcard-deck.resolver.ts`, `flashcard-decks-by-course.resolver.ts`,
`my-due-flashcards.resolver.ts`, `flashcard-cards-by-ids.resolver.ts`) only
apply `@UseGuards(KeycloakAuthGraphQLGuard)` — authentication, not
entitlement — and `GraphQLEnrollmentGuard` itself says in its own doc
(`src/modules/bussiness/guards/graphql-enrollment.guard.ts:24-27`) that it is
"permissive by design... does NOT enforce paid membership. Paid-only
surfaces... keep using `GraphQLMustEnrolledGuard`" — which no flashcard
resolver uses. What breaks: any authenticated (even trial, non-paying) user
can read every premium card's full answer/explanation for any course, via
`flashcardDeck`, `flashcardDecksByCourse`, `myDueFlashcards`, or
`flashcardCardsByIds` — the monetization control the field's own comment
claims exists has no enforcement anywhere.
- `src/modules/databases/postgresql/primary/entities/flashcard-card.entity.ts:184-201` (the unenforced claim)
- `src/modules/bussiness/flashcard/flashcard-deck.service.ts` (whole file — no `isPremium` check)
- `src/modules/bussiness/flashcard/flashcard-review.service.ts` (whole file — no `isPremium` check)
- `src/features/api/core/graphql/queries/flashcard-decks/flashcard-deck/flashcard-deck.resolver.ts:47` (auth only, no entitlement guard)
- `src/modules/bussiness/guards/graphql-enrollment.guard.ts:24-27` (contrast: the guard's own doc says it is not the enforcement mechanism)

## 2. [business-logic] No unique constraint on `user_flashcard_reviews(user, card)` — the documented "one row per pair" invariant is racy
The entity's own doc says "one row is upserted per (user, card)"
(`user-flashcard-review.entity.ts:22-27`), and `FlashcardReviewService.review()`
(`flashcard-review.service.ts:504-594`) implements this as read-then-branch:
`findOne` for an existing row, then `save` a new one in the `!existing`
branch — with no unique index on `(userId, flashcardCardId)` or
`(enrollmentId, flashcardCardId)` anywhere in
`src/modules/databases/postgresql/primary/migrations/` and no `SELECT ...
FOR UPDATE`/advisory lock serializing the check. Two concurrent
`reviewFlashcard` calls for the same never-before-reviewed card (a
double-click, or two open tabs) can both read `existing = null` before
either `save` commits, producing two review rows for the same (user,
card). Each insert calls `writeXpHistory` with a different `refId`
(`review.id`, generated fresh per row), so the `(source, refId)` idempotency
key in `writeXpHistory` — the documented "hard backstop for races"
(`write-xp-history.ts:56-57`) — does not catch this: it stops a replay of the
same row, not the creation of a second row. What breaks: double
`FLASHCARD_FIRST_REVIEW_XP` grant on the same card, and every subsequent
read (`existing = await manager.findOne(...)` with no `ORDER BY`) picks
whichever of the two duplicate rows Postgres returns first — nondeterministic
SM-2 state (ease/interval/repetitions) for that card going forward.
- `src/modules/databases/postgresql/primary/entities/user-flashcard-review.entity.ts:22-36` (claims the invariant, defines no constraint for it)
- `src/modules/bussiness/flashcard/flashcard-review.service.ts:504-594` (`review()` — read-then-write with no lock)
- `src/features/api/processors/ai/shared/xp/write-xp-history.ts:56-57` (idempotency key that does not cover this race)

## 3. [test-tier] The SM-2 scheduler and all three session services have zero unit tests
`flashcard-review.service.ts` (the SM-2 math, `listDue`'s two-bucket due
split, the first-review XP grant), `flashcard-review-session.service.ts`,
`flashcard-quiz-session.service.ts` (coverage-weighted XP, the daily cap,
weak-tag ranking), and `flashcard-due-review-session.service.ts` have no
`*.spec.ts` file anywhere in `src/modules/bussiness/flashcard/`. Only
`flashcard-deck.service.spec.ts` exists. Per the testing canon, unit is
"where a branch, a thrown exception, or an edge case belongs by default" —
here every branch of `applySm2` (lapse vs. recall, the three
interval-schedule cases), the `DAILY_NEW_LIMIT` cap math, the
`Not("completed")` race-tolerant `complete()` guard, and the server-side
coverage re-derivation in `FlashcardQuizSessionService.cardCoverage` are all
unverified by any automated test. What breaks: a refactor of the SM-2
constants or the ease floor, or an accidental sign flip in the interval
formula, changes every learner's review schedule silently — nothing goes
red.
- `src/modules/bussiness/flashcard/flashcard-review.service.ts` (whole file, no spec)
- `src/modules/bussiness/flashcard/flashcard-review-session.service.ts` (whole file, no spec)
- `src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts` (whole file, no spec)
- `src/modules/bussiness/flashcard/flashcard-due-review-session.service.ts` (whole file, no spec)

## 4. [business-logic] Comments describe a "global deck with no course" that the schema forbids
`FlashcardReviewService.review()` derives `courseId = cardExists.deck?.courseId
?? null` and comments "A deck without a course (global deck) leaves
enrollment unset" (`flashcard-review.service.ts:494-501`); the same
assumption repeats in `FlashcardQuizSessionService.computeWeakTags`
(`flashcard-quiz-session.service.ts:413-414`, `courseId` typed optional).
But `FlashcardDeckEntity.course` is `@ManyToOne(..., { onDelete: "CASCADE",
nullable: false })` (`flashcard-deck.entity.ts:204-216`) — a deck literally
cannot exist in the DB without a course. Either this is dead defensive code
describing a state that can never occur (in which case the `?? null` /
optional-`courseId` branches are untested paths masquerading as a real
feature), or a "global deck" was genuinely intended at some point and the FK
constraint is the actual bug. Either reading is worth resolving rather than
leaving three separate comments asserting a state the schema contradicts.
- `src/modules/bussiness/flashcard/flashcard-review.service.ts:494-501`
- `src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:413-414`
- `src/modules/databases/postgresql/primary/entities/flashcard-deck.entity.ts:204-216` (contrast: `nullable: false`)

## 5. [edge-case] Quick-quiz daily XP cap is read-then-write with no row lock
`FlashcardQuizSessionService.complete()` computes `grantedToday` via
`sumTodayQuizXp` and clamps `amount = min(sessionAmount, headroom)` inside
the same transaction as the ledger write
(`flashcard-quiz-session.service.ts:213-268`), but the cap check is a plain
`SUM(amount)` read followed by an `INSERT`, not a `SELECT ... FOR UPDATE` or
serializable isolation on the `(userId, courseId)` pair. Two concurrent
`completeFlashcardQuizSession` calls for different `sessionId`s (e.g. two
tabs finishing near-simultaneously) can each read the same pre-write
`grantedToday`, letting the combined grant exceed `DAILY_QUIZ_XP_CAP` (60)
by up to `MAX_XP_PER_SESSION` (15). Lower-severity than Finding #2 because
the (source, refId) idempotency key here does prevent a true double-credit
of the same session — this is only the cross-session cap being soft
rather than hard.
- `src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:213-268`

## 6. [edge-case] `FlashcardDeckReadService.getById` swallows every ES error into "not found"
`getById` (`flashcard-deck.service.ts:166-201`) catches any exception from
the Elasticsearch client and rethrows `FlashcardDeckNotFoundException`
regardless of the actual cause — a genuine ES outage, a mapping error, or a
timeout is indistinguishable from "this id does not exist" to the caller.
This matches the class-level comment's tolerance for the ES-missing-index
case, but goes further than needed: a real infrastructure failure now
surfaces to the FE as a 404 rather than a 5xx, which will be actively
misleading during an actual ES incident.
- `src/modules/bussiness/flashcard/flashcard-deck.service.ts:192-200`

## 7. [jsdoc] `FlashcardDeckResolverService.transform` carries no method-level JSDoc
The class-level doc on `FlashcardDeckResolverService`
(`flashcard-deck-resolver.service.ts:17-21`) explains the "mutate in place,
strip translations" contract, but the public `transform()` method itself has
no `@param`/`@returns` JSDoc, unlike the rest of this domain's otherwise
dense JSDoc coverage.
- `src/modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service.ts:29-33`
