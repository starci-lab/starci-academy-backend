# Projects and career

> Business head: `5879c49105264073469a07bd554395d44c6720211a10981fc8f58c5485e6faeb`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Learners progress through course personal-project milestones, submit a GitHub repository for an enrollment, inspect task feedback, and browse headhunting companies and consultants connected to the course.

Included:
- Personal project roadmap, task and task-result route families
- Personal GitHub repository submission
- Headhunting directory and company detail

Excluded:
- Public profile presentation of completed projects
- Job-posting administration and provider CRM behavior

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `eca4e018044f38900441790974c329c9cd4f3400` |

## 3. Actors and access

### Learner

- Follow a milestone roadmap
- Open the next task
- Submit a project GitHub URL
- Review task results
- Browse career companies and consultants

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

### StarCi Academy platform

- Persist the personal project GitHub URL on enrollment
- List headhunting companies

Evidence: `EV-007`, `EV-008`

## 4. Entry points and surfaces

### Personal project roadmap

- ID: `personal-project-roadmap`
- Route: `/[lang]/courses/[displayId]/learn/personal-project`
- Purpose: Show the next task and milestone completion evidence.
- Regions: `project-roadmap`
- Navigation: none

Evidence: `EV-001`, `EV-004`

### Personal project task

- ID: `personal-project-task`
- Route: `/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]{/result}`
- Purpose: Complete a task, submit repository evidence and inspect feedback.
- Regions: `project-task-work`
- Navigation: none

Evidence: `EV-002`, `EV-003`

### Career directory

- ID: `headhunting-directory`
- Route: `/[lang]/courses/[displayId]/learn/headhuntings`
- Purpose: Find headhunting companies and consultants.
- Regions: `career-results`
- Navigation: none

Evidence: `EV-005`

### Headhunting company

- ID: `headhunting-company`
- Route: `/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]`
- Purpose: Inspect one company from the course career directory.
- Regions: `company-profile`
- Navigation: none

Evidence: `EV-006`

## 5. Business flows

### Projects and career

Trigger: An enrolled learner opens the personal project or career route.

1. **learner** — Open the personal project roadmap and current milestone → The next task and completion evidence are displayed
2. **learner** — Submit the project GitHub URL for the course → The enrollment stores the repository URL
3. **learner** — Search companies and consultants and open a company → The selected career detail surface opens

Outcomes:
- The learner's enrollment retains the project repository and career destinations remain discoverable

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`

## 6. Business rules

### BR-01

The personal project roadmap exposes a deterministic next task, completion percentage/facts and milestone task navigation.

Strength: **confirmed** · Evidence: `EV-004`

### BR-02

Submitting a personal GitHub URL requires an authenticated user and an enrollment for the selected course, then persists the URL on that enrollment.

Strength: **confirmed** · Evidence: `EV-007`

### BR-03

The headhunting directory separates company and consultant results and can mark individual actions unavailable.

Strength: **confirmed** · Evidence: `EV-005`, `EV-008`

## 7. State model

- **Project or career surface ready** (`project-ready`, initial) → project-pending, project-complete, project-error — `EV-001`, `EV-004`, `EV-005`
- **Project submission pending** (`project-pending`, pending) → project-ready, project-complete, project-error — `EV-007`
- **Project milestone complete** (`project-complete`, success) → terminal — `EV-003`, `EV-004`
- **Project or career request failed** (`project-error`, error) → project-ready — `EV-004`, `EV-005`

## 8. Entities and data

- **Personal project**: course, milestones, tasks, completion percentage, GitHub URL — `EV-001`, `EV-004`, `EV-007`
- **Headhunting company**: company id, label, metadata, availability — `EV-005`, `EV-006`, `EV-008`
- **Consultant**: consultant id, label, metadata, contact availability — `EV-005`

## 9. Operations and APIs

- **submitPersonalGithubUrl** (mutation, backend) — input: course id, GitHub URL; output: updated enrollment; failures: authentication rejected, enrollment missing, URL rejected — `EV-007`
- **headhuntingCompanies** (query, backend) — input: none; output: headhunting companies; failures: query failed — `EV-008`

## 10. Acceptance conditions

- **AC-01** Personal project roadmap/task/result and career directory/company routes mount the declared surfaces. — `EV-001`, `EV-002`, `EV-003`, `EV-005`, `EV-006`
- **AC-02** An authenticated learner with a course enrollment can persist a personal project GitHub URL on that enrollment. — `EV-007`
- **AC-03** The backend exposes the headhunting company list used by the career directory. — `EV-008`

## 11. Explicit unknowns

- **What exact channel and response follows an available consultant contact action?** — The directory proves conditional contact availability but the cited surface and company query do not establish the downstream communication contract.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/courses/[displayId]/learn/personal-project/page.tsx:1` | route | The personal project route mounts the roadmap page. |
| EV-002 | fe | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/page.tsx:1` | route | The personal project task route mounts the task page. |
| EV-003 | fe | `src/app/[lang]/courses/[displayId]/learn/personal-project/tasks/[taskId]/result/page.tsx:1` | route | The task result route mounts the project result page. |
| EV-004 | fe | `src/components/pages/CoursePersonalProjectPage/component.tsx:30` | ui | The roadmap defines next task, completion evidence, milestone tasks and pending/ready/empty/failed states. |
| EV-005 | fe | `src/app/[lang]/courses/[displayId]/learn/headhuntings/page.tsx:1` | route | The course career route mounts the headhunting directory. |
| EV-006 | fe | `src/app/[lang]/courses/[displayId]/learn/headhunting-companies/[companyId]/page.tsx:1` | route | The dynamic company route mounts one headhunting company page. |
| EV-007 | be | `src/features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.handler.spec.ts:75` | test | The handler rejects missing users, stores the GitHub URL on the user's course enrollment and propagates missing-enrollment failure. |
| EV-008 | be | `src/features/api/core/graphql/queries/headhuntings/headhunting-companies/headhunting-companies.resolver.ts:55` | api | The optionally authenticated headhuntingCompanies query lists all companies. |
