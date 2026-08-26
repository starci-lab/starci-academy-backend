# Course learning and discussion

> Business head: `4ec13502d10b87242c6d9cc983e2a6ae2d205f9650bc7323c4dcb80acfdf2e00`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Enrolled learners navigate course modules, use the shared module conversation and kind-specific workbench, and prove applied knowledge through recoverable, trustworthy content Challenges.

Included:
- Course content map and lesson reader
- Reading/source/challenge faces
- Read state, reactions and lesson discussion
- Embedded challenge and result route family
- Course Q&A entry surface
- Course learning home with progress, next actions and learning signals
- A generic learning-module aggregate with exactly one required kind
- A shared conversation frame present in every module
- An open set of kind-specific workbenches, with document, spreadsheet and calendar as examples
- A recoverable Challenge journey across briefing, draft, submit, evaluation, result, retry and history
- Deterministic validation, rubric-constrained AI evidence and server-authoritative finalization
- Progressive hints and realistic post-fidelity AI-model UAT

Excluded:
- Standalone coding-practice catalog
- Course purchase and enrollment decisions
- The persistence strategy used to implement module inheritance
- Changing an existing module from one kind to another
- Mock Interview, Flashcards/quick quiz, Playground and Global Chat journeys
- Enrollment or purchase policy changes
- AI provider, deployment topology and authoring-studio redesign

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `595fd21545ad8f781cd465b4bd5e1a85302f6d42` |
| be | https://github.com/starci-lab/starci-academy-backend | `eccda3bd9df9abfdca22059ea88232fec3249af1` |

## 3. Actors and access

### Learner

- Navigate course content
- Read lesson material
- Use source workspace
- Use the shared module conversation and kind-specific workbench
- React and discuss
- Attempt embedded challenges
- Save and resume a Challenge draft
- Submit one immutable Challenge attempt
- Receive criterion-level feedback and retry without losing history
- Review course progress and choose the next action

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-015`, `EV-016`, `EV-017`

### StarCi Academy platform

- Return lesson content
- Persist read state
- Create lesson comments
- Mount the shared conversation frame for every module
- Resolve each module to exactly one kind-specific workbench
- Validate and finalize Challenge attempts without delegating pass or progress authority to model text
- Preserve Challenge attempt, evaluation and retry audit evidence

Evidence: `EV-007`, `EV-008`, `EV-014`, `EV-015`, `EV-016`, `EV-017`

## 4. Entry points and surfaces

### Course learning home

- ID: `course-home`
- Route: `/[lang]/courses/[displayId]/learn`
- Purpose: Review course progress and continue with the most relevant learning action.
- Regions: `course-home-summary`
- Navigation: none

Evidence: `EV-009`, `EV-010`

### Course content map

- ID: `content-map`
- Route: `/[lang]/courses/[displayId]/learn/content`
- Purpose: Choose the next module or lesson.
- Regions: `module-navigation`
- Navigation: none

Evidence: `EV-001`

### Lesson workspace

- ID: `lesson-workspace`
- Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]`
- Purpose: Use the shared module conversation and the workbench selected by the module kind.
- Regions: `module-conversation`, `module-workbench`, `lesson-reader`, `lesson-discussion`
- Navigation: none

Evidence: `EV-002`, `EV-003`, `EV-011`, `EV-012`, `EV-013`

### Content challenge

- ID: `content-challenge`
- Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}`
- Purpose: Complete a recoverable applied-learning attempt and receive trustworthy evidence-linked feedback without leaving the course context.
- Regions: `challenge-briefing`, `challenge-workbench`, `challenge-evaluation`, `challenge-result-history`
- Navigation: none

Evidence: `EV-004`, `EV-005`, `EV-016`, `EV-017`

### Course questions and answers

- ID: `course-qa`
- Route: `/[lang]/courses/[displayId]/learn/qa`
- Purpose: Open the course-level Q&A surface.
- Regions: `qa-thread-list`
- Navigation: none

Evidence: `EV-006`

## 5. Business flows

### Course learning and discussion

Trigger: An enrolled learner opens a course content route.

1. **learner** — Review course progress, next actions and learning signals → The learner can continue into the relevant course destination
2. **learner** — Choose a module from the course map and enter its shared conversation plus kind-specific workbench → The common conversation frame and exactly one registered workbench open for the module kind
3. **learner** — Read, use source, react or discuss → Progress and discussion operations are submitted
4. **learner** — Open an embedded challenge and submit an attempt → A challenge result surface becomes available

Outcomes:
- The learner advances through course content with persisted engagement evidence

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-012`, `EV-013`, `EV-014`, `EV-015`

### Recoverable content challenge

Trigger: An authenticated learner with course access opens a Challenge attached to course content.

1. **learner** — Review the exact task, constraints, rubric and permitted-help policy → Required evidence and availability are clear
2. **learner** — Create and save a recoverable draft with policy-limited hints → The latest draft is resumable
3. **learner** — Submit the current draft once → One immutable attempt enters deterministic and rubric-constrained evaluation
4. **learner** — Inspect criterion evidence, gaps, uncertainty and next action → A server-authoritative result is visible
5. **learner** — Retry or resume an interrupted evaluation → Prior attempt and result history remain intact

Outcomes:
- The learner proves applied course knowledge and receives trustworthy evidence-linked feedback for the next learning action

Evidence: `EV-004`, `EV-005`, `EV-016`, `EV-017`

## 6. Business rules

### BR-01

A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.

Strength: **confirmed** · Evidence: `EV-003`

### BR-02

Read state and comments require authenticated course access guards.

Strength: **confirmed** · Evidence: `EV-007`, `EV-008`

### BR-03

Every learning module has exactly one required kind.

Strength: **owner-confirmed** · Evidence: `EV-014`

### BR-04

Chat is a shared capability of every learning module and is not one module kind; document, accounting or spreadsheet, scheduling or calendar, and future kinds identify workbench behavior.

Strength: **owner-confirmed** · Evidence: `EV-015`

### BR-05

Shared module identity, ordering, lifecycle and conversation frame remain common while exactly one module kind owns the additional workbench state, behavior and learner presentation.

Strength: **owner-confirmed** · Evidence: `EV-015`

### BR-06

Adding a future module kind must not redefine the business contract of the base learning-module aggregate.

Strength: **owner-confirmed** · Evidence: `EV-014`, `EV-015`

### BR-07

Opening any module mounts one shared conversational shell and exactly one workbench resolved from its kind registry entry.

Strength: **owner-confirmed** · Evidence: `EV-015`

### BR-08–BR-10 · Access and immutable attempts

Challenge access remains guarded; attempts bind exact learner, Challenge and rubric revisions; drafts remain distinct; submission is idempotent and immutable.

Strength: **owner-confirmed** · Evidence: `EV-016`

### BR-11–BR-12 · Evaluation authority

Deterministic checks own objective validation. AI supplies advisory evidence only; platform policy alone finalizes outcome and progress.

Strength: **owner-confirmed** · Evidence: `EV-016`

### BR-13–BR-15 · Safe feedback and help

Feedback binds rubric criteria to observed attempt evidence and uncertainty. Progressive hints cannot leak complete solutions, and embedded learner instructions cannot change rubric, tools or data scope.

Strength: **owner-confirmed** · Evidence: `EV-016`, `EV-017`

### BR-16–BR-19 · Failure, retry, audit and locale

Unavailable or low-confidence evaluation recovers safely without consuming retry; retries preserve history; duplicate/concurrent finalization settles once; locale cannot change rubric meaning or outcome.

Strength: **owner-confirmed** · Evidence: `EV-016`, `EV-017`

## 7. State model

- **Course home ready** (`course-home-ready`, initial) → lesson-ready — `EV-009`, `EV-010`
- **Lesson ready** (`lesson-ready`, initial) → lesson-pending, lesson-error — `EV-001`, `EV-002`, `EV-003`
- **Engagement pending** (`lesson-pending`, pending) → lesson-ready, lesson-error — `EV-007`, `EV-008`
- **Lesson locked** (`lesson-locked`, partial) → terminal — `EV-003`
- **Lesson failed** (`lesson-error`, error) → lesson-ready — `EV-003`
- **Challenge locked** (`challenge-locked`, partial) → terminal — `EV-004`, `EV-016`
- **Challenge ready** (`challenge-ready`, initial) → challenge-draft, challenge-submitting — `EV-004`, `EV-016`
- **Challenge draft saved** (`challenge-draft`, pending) → challenge-draft, challenge-submitting — `EV-016`
- **Challenge submission accepted** (`challenge-submitting`, pending) → challenge-evaluating, challenge-draft — `EV-016`
- **Challenge evaluating** (`challenge-evaluating`, pending) → challenge-result, challenge-evaluation-unavailable — `EV-016`, `EV-017`
- **Challenge result finalized** (`challenge-result`, success) → challenge-draft — `EV-005`, `EV-016`, `EV-017`
- **Challenge evaluation unavailable** (`challenge-evaluation-unavailable`, error) → challenge-evaluating, challenge-draft — `EV-016`, `EV-017`

## 8. Entities and data

- **Learning module**: id, course, title, description, position, kind, status, created at, updated at, conversation state, kind-specific workbench state — `EV-014`, `EV-015`
- **Lesson content**: course, module, content, body, faces, source, outline, next steps — `EV-002`, `EV-003`
- **Lesson comment**: content id, parent id, body — `EV-008`
- **Challenge attempt**: learner/course/content identity, Challenge/rubric/draft/submission revisions, answer or artifact refs, idempotency key, status and timestamps — `EV-016`
- **Challenge evaluation and result**: deterministic and AI advisory evidence, criterion evidence, confidence, platform decision, feedback, next action and finalization revision — `EV-016`, `EV-017`

## 9. Operations and APIs

- **markContentAsReaded** (mutation, backend) — input: content id, read flag; output: updated learner content state; failures: authentication rejected, course access rejected, content missing — `EV-007`
- **createComment** (mutation, backend) — input: content id, optional parent comment, body; output: created comment; failures: authentication rejected, course access rejected, invalid parent or content — `EV-008`
- **saveChallengeDraft** (mutation, backend) — revisioned recoverable draft with optimistic conflict handling — `EV-016`
- **submitChallengeAttempt** (mutation, backend) — idempotent immutable submission bound to exact Challenge and rubric revisions — `EV-016`
- **evaluateChallengeAttempt** (operation, backend) — deterministic evidence plus rubric-constrained AI advisory evidence and uncertainty — `EV-016`, `EV-017`
- **finalizeChallengeResult** (mutation, backend) — one platform-owned result, progress transition and audit revision — `EV-016`, `EV-017`
- **retryChallengeAttempt** (mutation, backend) — new draft revision with preserved history — `EV-016`

## 10. Acceptance conditions

- **AC-01** Course home, content map, lesson, embedded challenge/result and course Q&A routes mount the declared learning surfaces. — `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`, `EV-009`, `EV-010`
- **AC-02** Authenticated learners can persist lesson read state and create top-level comments or replies on content. — `EV-007`, `EV-008`
- **AC-03** The lesson workspace reuses existing nested layouts and presents the course map, centered reader, optional outline and current overlays as one composed full viewport without redesigning existing shell regions. — `EV-011`
- **AC-04** SCHEMA V2 lessons render every authored programming-language tab, resolve the routed locale with default-body fallback, and rebuild the on-page outline from the selected article. — `EV-012`, `EV-013`
- **AC-05** Module creation is rejected when its kind is missing. — `EV-014`
- **AC-06** A persisted module resolves to one and only one kind-specific workbench in addition to the shared conversation frame. — `EV-014`, `EV-015`
- **AC-07** Every resolved module exposes the shared conversation frame and exactly one workbench selected by its kind. — `EV-015`
- **AC-08** A new module kind can add a workbench contract without changing the base module or shared conversation contract. — `EV-014`, `EV-015`
- **AC-09** Missing, duplicated or kind-mismatched workbench state is rejected as an invariant violation. — `EV-014`, `EV-015`
- **AC-10** Eligible learners complete the recoverable Challenge journey without losing prior attempts. — `EV-004`, `EV-005`, `EV-016`
- **AC-11** Final results expose platform outcome, criterion evidence, gaps, uncertainty and next action. — `EV-016`, `EV-017`
- **AC-12** Model output cannot directly change pass, progress, rubric, tools or data scope. — `EV-016`, `EV-017`
- **AC-13** AI UAT covers correct, equivalent, partial, incorrect and off-topic answers. — `EV-017`
- **AC-14** AI UAT covers empty, malformed, oversized, unsupported, multilingual and adversarial submissions without leakage. — `EV-017`
- **AC-15** Provider and confidence failures preserve attempts and expose safe resume without consuming retry. — `EV-016`, `EV-017`
- **AC-16** Duplicate, concurrent and resumed processing settles idempotently to one result and progress transition. — `EV-016`, `EV-017`
- **AC-17** Equivalent answers remain materially consistent across supported locales. — `EV-017`
- **AC-18** Product UAT follows fidelity and proves the complete journey, keyboard operation and approved responsive layouts. — `EV-016`, `EV-017`

## 11. Explicit unknowns

- **Which exact purchase or enrollment action should every locked lesson show?** — The lesson surface confirms a locked state but does not establish one universal recovery action across all entry contexts.
- **May a module change kind after creation, or must it be replaced or migrated?** — The owner confirmed exactly one kind but did not authorize an in-place kind transition.
- **Which persistence inheritance strategy implements the approved module-kind contract?** — STI, CTI, JSONB and referenced aggregates remain architecture alternatives, not business truth.
- **Which authoring and learner permissions are common versus kind-specific?** — The shared and kind-owned permission boundary remains undefined.
- **Does one module own one conversation or multiple threads?** — The owner confirmed a common chat frame but did not define conversation cardinality or mailbox behavior.
- **Are external workbenches embedded, linked, or implemented natively?** — Spreadsheet, Excel and calendar examples establish workbench purpose but not provider or integration strategy.
- **Which physical store and transaction boundary own Challenge records?** — Architecture must assign exact storage, writer, migration, backup and recovery ownership.
- **Which model provider, queue and structured-output implementation realize evaluation?** — Runtime choices must preserve approved authority and failure semantics.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/courses/[displayId]/learn/content/page.tsx:1` | route | The course content home route mounts the content-map page for displayId. |
| EV-002 | fe | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/page.tsx:1` | route | The dynamic module/content route mounts CourseLearnContentPage. |
| EV-003 | fe | `src/components/pages/CourseLearnContentPage/component.tsx:80` | ui | The lesson page defines pending/ready/locked/failed states, reading/source/challenge faces, reactions, discussion, progress and outline data/actions. |
| EV-004 | fe | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/page.tsx:1` | route | The embedded challenge route mounts the challenge page. |
| EV-005 | fe | `src/app/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]/result/page.tsx:1` | route | The embedded challenge result route mounts the result page. |
| EV-006 | fe | `src/app/[lang]/courses/[displayId]/learn/qa/page.tsx:1` | route | The course Q&A route mounts CourseQaPage. |
| EV-007 | be | `src/features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.resolver.ts:60` | api | The guarded markContentAsReaded mutation changes a learner's read state for content. |
| EV-008 | be | `src/features/api/core/graphql/mutations/discussion/create-comment/create-comment.resolver.ts:55` | api | The guarded createComment mutation creates a top-level comment or reply on content. |
| EV-009 | fe | `src/app/[lang]/courses/[displayId]/learn/page.tsx:1` | route | The bare course learn route mounts CourseLearnTodayPage for the course display id. |
| EV-010 | fe | `src/components/pages/CourseLearnTodayPage/index.tsx:91` | ui | The connected course home composes progress, ranked next actions and learning signals with independently settling states and course destinations. |
| EV-011 | owner | `decision:340a6bdeede7cc5dfbae0841fd54930fb1de9288c8f918e260cb96827f107ece` | owner-decision | The owner accepted composed reader revision 340a6bdeede7cc5dfbae0841fd54930fb1de9288c8f918e260cb96827f107ece, then explicitly authorized the seven-file SCHEMA V2 language-body corrective boundary. |
| EV-012 | fe | `src/modules/api/graphql/queries/query-content.ts:23` | api | The authenticated lesson query selects the legacy scalar body and every SCHEMA V2 programming-language body with locale translations. |
| EV-013 | fe | `src/components/pages/CourseLearnContentPage/index.tsx:98` | ui | The connected lesson reader orders language bodies, preserves a valid language choice, resolves the routed locale with authored fallback, and derives the page outline from the selected markdown. |
| EV-014 | owner | `decision:a887a41b7e0adb78ec2da291b5d01cbb8b386113d798eee242222445218f15a0` | owner-decision | The owner confirmed that the platform will support many modules, every module has exactly one kind, chatbot and document are only the first kinds, and the model must scale through inheritance rather than permanent hard-coded branches. |
| EV-015 | owner | `decision:af23be552cece34ef04f8a091967b0c267488082d7cd63b48ecf1efa906c93ee` | owner-decision | The owner clarified that every learning module includes the shared chat frame, while the module kind selects an additional workbench; accounting or spreadsheet, scheduling or calendar, document and future workbenches are open-set examples. |
| EV-016 | owner | `decision:f9032ac5841c61dcb4ce9a5013877945a2e8d9d630b92f95b2debc23d280e839` | owner-decision | The owner approved the recoverable hybrid Challenge journey and server-owned finalization authority. |
| EV-017 | owner | `decision:f9032ac5841c61dcb4ce9a5013877945a2e8d9d630b92f95b2debc23d280e839` | owner-decision | The approved revision requires the realistic AI-model UAT matrix and safety/failure coverage. |
