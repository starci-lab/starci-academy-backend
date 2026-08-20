# Study library

> Business head: `32dfc8af971c614a5c5bdd6ba78d194b07af476e13a28e643f69edc63e0feef1`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Learners use course flashcard review and quiz sessions, browse foundational reference materials, and inspect the course mind map as complementary study modes.

Included:
- Flashcard review and quiz route families
- Resumable review sessions and results
- Foundation categories and resources
- Course mind map

Excluded:
- Standalone coding problems
- Mock interview assessment

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `b78f77ec44905abd1619ac95ac50bfad744c7e96` |
| be | https://github.com/starci-lab/starci-academy-backend | `0ed7b7bc8e1bcd8c7dc684856f2a15ed798ad57b` |

## 3. Actors and access

### Learner

- Review due flashcards
- Start or resume a deck session
- Take a flashcard quiz
- Browse foundation resources
- Open the course mind map

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

### StarCi Academy platform

- Persist resumable flashcard sessions
- List foundation resources

Evidence: `EV-006`, `EV-007`

## 4. Entry points and surfaces

### Flashcards

- ID: `flashcard-library`
- Route: `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}`
- Purpose: Choose review or quiz work and start or resume a session.
- Regions: `flashcard-decks`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Flashcard session

- ID: `flashcard-session`
- Route: `/[lang]/courses/[displayId]/learn/flashcards/{review|quiz}/sessions/[sessionId]{/result}`
- Purpose: Work through an ordered review or quiz and inspect the result.
- Regions: `flashcard-run`
- Navigation: none

Evidence: `EV-001`, `EV-006`

### Foundations

- ID: `foundation-library`
- Route: `/[lang]/courses/[displayId]/learn/foundations{/[categoryId]/[foundationId]}`
- Purpose: Find and open reference foundations by category.
- Regions: `foundation-catalog`
- Navigation: none

Evidence: `EV-003`, `EV-004`

### Course mind map

- ID: `course-mind-map`
- Route: `/[lang]/courses/[displayId]/learn/mind-map`
- Purpose: Inspect the course knowledge structure as a mind map.
- Regions: `mind-map`
- Navigation: none

Evidence: `EV-005`

## 5. Business flows

### Study library

Trigger: A learner opens a course study-tool route.

1. **learner** — Choose flashcards, foundations or mind map → The selected study surface opens
2. **learner** — Start or resume a due/deck flashcard session → A persisted ordered review session is returned
3. **learner** — Search or page foundation categories and open a resource → The selected reference content opens

Outcomes:
- The learner receives a resumable study session or reaches the selected reference material

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`

## 6. Business rules

### BR-01

Flashcard review distinguishes due work, deck statistics, resume state and pending/ready/empty/failed outcomes.

Strength: **confirmed** · Evidence: `EV-002`

### BR-02

Starting a flashcard review persists the chosen deck and card order as a resumable session.

Strength: **confirmed** · Evidence: `EV-006`

### BR-03

Foundation browsing supports pagination and can settle as pending, ready, empty, failed or partial.

Strength: **confirmed** · Evidence: `EV-004`, `EV-007`

## 7. State model

- **Study mode ready** (`study-ready`, initial) → study-pending, study-empty, study-error — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`
- **Study session pending** (`study-pending`, pending) → study-ready, study-error — `EV-006`, `EV-007`
- **No study material** (`study-empty`, empty) → study-ready — `EV-002`, `EV-004`
- **Study tool failed** (`study-error`, error) → study-ready — `EV-002`, `EV-004`

## 8. Entities and data

- **Flashcard deck**: id, title, description, difficulty, card count, due count, mastered count — `EV-002`
- **Flashcard session**: session id, deck id, ordered cards, progress, result — `EV-001`, `EV-006`
- **Foundation category**: id, title, description, thumbnail, resources — `EV-003`, `EV-004`, `EV-007`

## 9. Operations and APIs

- **startFlashcardReviewSession** (mutation, backend) — input: deck id, card order; output: resumable review session; failures: authentication rejected, deck unavailable, session creation failed — `EV-006`
- **foundations** (query, backend) — input: category id, pagination; output: foundation page; failures: category missing, query failed — `EV-007`

## 10. Acceptance conditions

- **AC-01** Flashcard, foundation and mind-map routes mount their declared study surfaces. — `EV-001`, `EV-003`, `EV-005`
- **AC-02** Starting a review persists a resumable session for the selected deck and card order. — `EV-006`
- **AC-03** Foundation queries return a paginated list for the selected category. — `EV-007`

## 11. Explicit unknowns

- **Is the learner ever allowed to edit the course mind map?** — The current route proves a viewing surface only, so prototypes must not invent authoring controls.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/courses/[displayId]/learn/flashcards/review/page.tsx:1` | route | The flashcard review route mounts the review catalog for a course. |
| EV-002 | fe | `src/components/pages/CourseFlashcardsReviewPage/component.tsx:14` | ui | The review page exposes due/deck counts, statistics, start/resume actions and settled states. |
| EV-003 | fe | `src/app/[lang]/courses/[displayId]/learn/foundations/page.tsx:1` | route | The foundations route mounts the course foundation library. |
| EV-004 | fe | `src/components/pages/CourseFoundationsPage/component.tsx:15` | ui | The foundation library defines search, pagination, categories, enrollment recovery and pending/ready/empty/failed/partial states. |
| EV-005 | fe | `src/app/[lang]/courses/[displayId]/learn/mind-map/page.tsx:1` | route | The course mind-map route mounts CourseMindMapPage. |
| EV-006 | be | `src/features/api/core/graphql/mutations/flashcard/start-flashcard-review-session/start-flashcard-review-session.resolver.ts:68` | api | The guarded mutation persists a resumable flashcard review session for a deck and card order. |
| EV-007 | be | `src/features/api/core/graphql/queries/foundations/foundations/foundations.resolver.ts:45` | api | The foundations query lists paginated foundations for a category. |
| EV-008 | owner | `decision:2e6794d9a35c5acc029dee9eafc2978fa91dd9589da5f8ce3f6111cbfb465275` | owner-decision | The owner authorized refreshing study-library and practice-assessment to current routed source heads before continuing the four-layout design set. |
