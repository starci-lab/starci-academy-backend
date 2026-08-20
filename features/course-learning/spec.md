# Course learning and discussion

> Business head: `17b54cb4b32ed08d854569e448ea95fd61d438e81b6d38f22e5d2923d97ea30f`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Enrolled learners navigate course modules and lesson content, read or edit source snapshots, mark progress, react, discuss lessons, and complete embedded content challenges.

Included:
- Course content map and lesson reader
- Reading/source/challenge faces
- Read state, reactions and lesson discussion
- Embedded challenge and result route family
- Course Q&A entry surface
- Course learning home with progress, next actions and learning signals

Excluded:
- Standalone coding-practice catalog
- Course purchase and enrollment decisions

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `0ed7b7bc8e1bcd8c7dc684856f2a15ed798ad57b` |

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

Evidence: `EV-007`, `EV-008`

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

Evidence: `EV-002`, `EV-003`

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
2. **learner** — Choose a module and lesson from the course map → The lesson reader opens
3. **learner** — Read, use source, react or discuss → Progress and discussion operations are submitted
4. **learner** — Open an embedded challenge and submit an attempt → A challenge result surface becomes available

Outcomes:
- The learner advances through course content with persisted engagement evidence

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`, `EV-010`

## 6. Business rules

### BR-01

A lesson can settle as pending, ready, locked or failed and exposes independently settling source, reaction and discussion regions.

Strength: **confirmed** · Evidence: `EV-003`

### BR-02

Read state and comments require authenticated course access guards.

Strength: **confirmed** · Evidence: `EV-007`, `EV-008`

## 7. State model

- **Course home ready** (`course-home-ready`, initial) → lesson-ready — `EV-009`, `EV-010`
- **Lesson ready** (`lesson-ready`, initial) → lesson-pending, lesson-error — `EV-001`, `EV-002`, `EV-003`
- **Engagement pending** (`lesson-pending`, pending) → lesson-ready, lesson-error — `EV-007`, `EV-008`
- **Lesson locked** (`lesson-locked`, partial) → terminal — `EV-003`
- **Lesson failed** (`lesson-error`, error) → lesson-ready — `EV-003`

## 8. Entities and data

- **Lesson content**: course, module, content, body, faces, source, outline, next steps — `EV-002`, `EV-003`
- **Lesson comment**: content id, parent id, body — `EV-008`

## 9. Operations and APIs

- **markContentAsReaded** (mutation, backend) — input: content id, read flag; output: updated learner content state; failures: authentication rejected, course access rejected, content missing — `EV-007`
- **createComment** (mutation, backend) — input: content id, optional parent comment, body; output: created comment; failures: authentication rejected, course access rejected, invalid parent or content — `EV-008`

## 10. Acceptance conditions

- **AC-01** Course home, content map, lesson, embedded challenge/result and course Q&A routes mount the declared learning surfaces. — `EV-001`, `EV-002`, `EV-004`, `EV-005`, `EV-006`, `EV-009`, `EV-010`
- **AC-02** Authenticated learners can persist lesson read state and create top-level comments or replies on content. — `EV-007`, `EV-008`

## 11. Explicit unknowns

- **Which exact purchase or enrollment action should every locked lesson show?** — The lesson surface confirms a locked state but does not establish one universal recovery action across all entry contexts.

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
