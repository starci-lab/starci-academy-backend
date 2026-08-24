# Course learning and discussion

> Business head: `17b1d88700e40db815dc135b7b6fb8ebe85eea667dd867ff50bbf3c948d94473`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Enrolled learners navigate course modules with exactly one kind, enter the kind-specific workspace, read or edit lesson content, mark progress, react, discuss lessons, and complete embedded challenges.

Included:
- Course content map and lesson reader
- Reading/source/challenge faces
- Read state, reactions and lesson discussion
- Embedded challenge and result route family
- Course Q&A entry surface
- Course learning home with progress, next actions and learning signals
- A generic learning-module aggregate with exactly one required kind
- Kind-specific module workspaces, beginning with chatbot and document

Excluded:
- Standalone coding-practice catalog
- Course purchase and enrollment decisions
- The persistence strategy used to implement module inheritance
- Changing an existing module from one kind to another

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `f14e3c24b4a087fb6d4bb09d73526964d3ecea3c` |
| be | https://github.com/starci-lab/starci-academy-backend | `eeeaef30b60b823eb894fed410cc6742ed0bd08f` |

## 3. Actors and access

### Learner

- Navigate course content
- Read lesson material
- Use source workspace
- React and discuss
- Attempt embedded challenges
- Review course progress and choose the next action

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

### StarCi Academy platform

- Return lesson content
- Persist read state
- Create lesson comments
- Resolve each module to exactly one kind-specific workspace

Evidence: `EV-007`, `EV-008`, `EV-014`

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
- Purpose: Read lesson content and use its engagement tools.
- Regions: `lesson-reader`, `lesson-discussion`
- Navigation: none

Evidence: `EV-002`, `EV-003`, `EV-011`, `EV-012`, `EV-013`

### Content challenge

- ID: `content-challenge`
- Route: `/[lang]/courses/[displayId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]{/result}`
- Purpose: Attempt a challenge attached to a lesson and inspect its result.
- Regions: `challenge-attempt`
- Navigation: none

Evidence: `EV-004`, `EV-005`

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
2. **learner** — Choose a module from the course map and enter its kind-specific workspace → The chatbot mailbox, document workspace or another registered kind workspace opens
3. **learner** — Read, use source, react or discuss → Progress and discussion operations are submitted
4. **learner** — Open an embedded challenge and submit an attempt → A challenge result surface becomes available

Outcomes:
- The learner advances through course content with persisted engagement evidence

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`, `EV-012`, `EV-013`, `EV-014`

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

Chatbot and document are initial module kinds, not the complete or permanently closed kind set.

Strength: **owner-confirmed** · Evidence: `EV-014`

### BR-05

Shared module identity, ordering and lifecycle remain common while each kind owns its specific state, behavior and learner presentation.

Strength: **owner-confirmed** · Evidence: `EV-014`

### BR-06

Adding a future module kind must not redefine the business contract of the base learning-module aggregate.

Strength: **owner-confirmed** · Evidence: `EV-014`

### BR-07

A chatbot module opens a mailbox and conversation workspace; a document module opens a document workspace.

Strength: **owner-confirmed** · Evidence: `EV-014`

## 7. State model

- **Course home ready** (`course-home-ready`, initial) → lesson-ready — `EV-009`, `EV-010`
- **Lesson ready** (`lesson-ready`, initial) → lesson-pending, lesson-error — `EV-001`, `EV-002`, `EV-003`
- **Engagement pending** (`lesson-pending`, pending) → lesson-ready, lesson-error — `EV-007`, `EV-008`
- **Lesson locked** (`lesson-locked`, partial) → terminal — `EV-003`
- **Lesson failed** (`lesson-error`, error) → lesson-ready — `EV-003`

## 8. Entities and data

- **Learning module**: id, course, title, description, position, kind, status, created at, updated at, kind-specific state — `EV-014`
- **Lesson content**: course, module, content, body, faces, source, outline, next steps — `EV-002`, `EV-003`
- **Lesson comment**: content id, parent id, body — `EV-008`

## 9. Operations and APIs

- **markContentAsReaded** (mutation, backend) — input: content id, read flag; output: updated learner content state; failures: authentication rejected, course access rejected, content missing — `EV-007`
- **createComment** (mutation, backend) — input: content id, optional parent comment, body; output: created comment; failures: authentication rejected, course access rejected, invalid parent or content — `EV-008`

## 10. Acceptance conditions

- **AC-01** Course home, content map, lesson, embedded challenge/result and course Q&A routes mount the declared learning surfaces. — `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`, `EV-009`, `EV-010`
- **AC-02** Authenticated learners can persist lesson read state and create top-level comments or replies on content. — `EV-007`, `EV-008`
- **AC-03** The lesson workspace reuses existing nested layouts and presents the course map, centered reader, optional outline and current overlays as one composed full viewport without redesigning existing shell regions. — `EV-011`
- **AC-04** SCHEMA V2 lessons render every authored programming-language tab, resolve the routed locale with default-body fallback, and rebuild the on-page outline from the selected article. — `EV-012`, `EV-013`
- **AC-05** Module creation is rejected when its kind is missing. — `EV-014`
- **AC-06** A persisted module resolves to one and only one kind-specific behavior and workspace. — `EV-014`
- **AC-07** Chatbot and document modules resolve to the mailbox/conversation and document workspaces respectively. — `EV-014`
- **AC-08** A third module kind can be introduced without changing the base module business contract. — `EV-014`
- **AC-09** Missing, duplicated or kind-mismatched kind-specific state is rejected as an invariant violation. — `EV-014`

## 11. Explicit unknowns

- **Which exact purchase or enrollment action should every locked lesson show?** — The lesson surface confirms a locked state but does not establish one universal recovery action across all entry contexts.
- **May a module change kind after creation, or must it be replaced or migrated?** — The owner confirmed exactly one kind but did not authorize an in-place kind transition.
- **Which persistence inheritance strategy implements the approved module-kind contract?** — STI, CTI, JSONB and referenced aggregates remain architecture alternatives, not business truth.
- **Which authoring and learner permissions are common versus kind-specific?** — The shared and kind-owned permission boundary remains undefined.

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
