# Progress, profile and league

> Business head: `270747c88bd992cf607ddf1c6e0e5faecb2abece9bc40027f323eecd1a767595`
>
> This document is generated from the immutable business model. Update the model through `starci-business-analyze`; do not hand-edit this view.

## 1. Overview

Authenticated learners review their learning dashboard, quests, streak, goals, job readiness and community tabs; inspect public profile evidence; update profile settings; and compare weekly or global league standing.

Included:
- Authenticated dashboard overview, explore, courses and community tabs
- Daily quest and progress evidence
- Public profile overview and related profile routes
- Profile updates
- Weekly/global league surface

Excluded:
- Course-specific learning execution
- Private administrative user management

## 2. Source heads

| Role | Repository | Head |
|---|---|---|
| fe | https://github.com/starci-lab/starci-academy-fe.git | `84bf3be6565a20b1fee9c83cab8b9ba810d13e11` |
| be | https://github.com/starci-lab/starci-academy-backend | `eca4e018044f38900441790974c329c9cd4f3400` |

## 3. Actors and access

### Learner

- Review personal learning progress
- Claim completed daily quest rewards
- Inspect public profile evidence
- Update editable profile fields
- Compare league standing

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`

### StarCi Academy platform

- Persist partial profile updates
- Grant one completed daily quest reward
- Return weekly league standing

Evidence: `EV-007`, `EV-008`, `EV-009`

## 4. Entry points and surfaces

### Learning dashboard

- ID: `learning-dashboard`
- Route: `/[lang]/dashboard{?tab=overview|explore|courses|community}`
- Purpose: Summarize identity, learning momentum and available destinations.
- Regions: `dashboard-rail`, `dashboard-main`
- Navigation: none

Evidence: `EV-001`, `EV-002`

### Public learner profile

- ID: `public-profile`
- Route: `/[lang]/profile/[username]{/activity|/cv|/projects|/challenges|/skills}`
- Purpose: Present job readiness, courses, contributions, project, challenge and skill evidence.
- Regions: `profile-evidence`
- Navigation: none

Evidence: `EV-003`, `EV-004`

### League

- ID: `league-standing`
- Route: `/[lang]/league`
- Purpose: Compare weekly or global standing and identify the viewer's position.
- Regions: `ranked-cohort`
- Navigation: none

Evidence: `EV-005`, `EV-006`

## 5. Business flows

### Progress, profile and league

Trigger: An authenticated learner opens the dashboard or a profile/league route.

1. **learner** — Open dashboard overview or another dashboard tab → Identity, learning, quest, streak, goals and community regions settle independently
2. **learner** — Claim a completed daily quest → Points are granted once for the day
3. **learner** — Open a public profile or evidence subroute → Public learning, project, challenge and skill evidence is displayed
4. **learner** — Choose weekly or global standing → Podium, viewer standing and ranked rows are displayed

Outcomes:
- The learner can understand current progress, public evidence and comparative standing

Evidence: `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`, `EV-007`, `EV-008`, `EV-009`

## 6. Business rules

### BR-01

The dashboard is authenticated and keeps overview blocks independently settling rather than treating the whole page as one request.

Strength: **confirmed** · Evidence: `EV-001`, `EV-002`

### BR-02

Profile updates are partial: omitted keys remain unchanged, explicit null clears nullable fields, strings are trimmed where declared, and the refreshed row is returned.

Strength: **confirmed** · Evidence: `EV-007`

### BR-03

A daily quest reward can be claimed only after completion and only once per day in one atomic grant.

Strength: **confirmed** · Evidence: `EV-008`

### BR-04

The league surface supports weekly and global scopes and preserves the viewer's own standing alongside ranked identities.

Strength: **confirmed** · Evidence: `EV-005`, `EV-006`, `EV-009`

## 7. State model

- **Progress surface ready** (`progress-ready`, initial) → progress-pending, progress-empty, progress-error — `EV-001`, `EV-002`, `EV-003`, `EV-004`, `EV-005`, `EV-006`
- **Progress action pending** (`progress-pending`, pending) → progress-ready, progress-error — `EV-007`, `EV-008`, `EV-009`
- **No public or league evidence** (`progress-empty`, empty) → progress-ready — `EV-004`, `EV-006`
- **Progress request failed** (`progress-error`, error) → progress-ready — `EV-002`, `EV-006`

## 8. Entities and data

- **Learner profile**: display name, bio, avatar, role title, location, visibility, work preferences, links, branding — `EV-003`, `EV-004`, `EV-007`
- **Dashboard progress**: courses, daily quest, streak, weekly goals, job readiness, weekly challenge, contributions — `EV-002`
- **League standing**: scope, tier, rank, cohort, points, podium — `EV-005`, `EV-006`, `EV-009`

## 9. Operations and APIs

- **updateProfile** (mutation, backend) — input: partial identity, preference and branding patch; output: refreshed user; failures: authentication rejected, field validation rejected, persistence failed — `EV-007`
- **claimDailyQuestReward** (mutation, backend) — input: none; output: granted points and completion; failures: authentication rejected, quest incomplete, already claimed today — `EV-008`
- **myLeague** (query, backend) — input: none; output: weekly tier and ranked cohort; failures: authentication rejected, league unavailable — `EV-009`

## 10. Acceptance conditions

- **AC-01** Dashboard, public profile and league routes mount their declared progress surfaces. — `EV-001`, `EV-003`, `EV-005`
- **AC-02** Profile updates persist only submitted fields and return a refreshed user row. — `EV-007`
- **AC-03** Daily quest claim grants the completed reward once per day or returns the typed incomplete/already-claimed failure. — `EV-008`
- **AC-04** myLeague returns the authenticated viewer's weekly tier and ranked cohort. — `EV-009`

## 11. Explicit unknowns

- **Does the global league tab use the same myLeague response or a separate query?** — The UI proves a global selection, while the cited backend query explicitly guarantees the viewer's weekly league only.

## 12. Evidence index

| ID | Role | Source | Kind | Claim |
|---|---|---|---|---|
| EV-001 | fe | `src/app/[lang]/dashboard/page.tsx:1` | route | The dashboard route mounts DashboardPage. |
| EV-002 | fe | `src/components/pages/DashboardPage/component.tsx:19` | ui | The authenticated dashboard composes identity/quick actions and overview, explore, courses or community main content with independently settling blocks. |
| EV-003 | fe | `src/app/[lang]/profile/[username]/page.tsx:1` | route | The dynamic username route mounts the public profile overview. |
| EV-004 | fe | `src/components/pages/ProfileOverviewPage/component.tsx:9` | ui | The public overview composes job readiness, courses, contributions, challenge skills and coding skills. |
| EV-005 | fe | `src/app/[lang]/league/page.tsx:1` | route | The league route mounts the full leaderboard. |
| EV-006 | fe | `src/components/pages/LeaguePage/component.tsx:21` | ui | The league surface defines weekly/global scope, viewer standing, podium, ranked rows and empty/error recovery. |
| EV-007 | be | `src/features/api/core/graphql/mutations/profile/update-profile/update-profile.resolver.ts:48` | api | The authenticated updateProfile mutation performs partial updates and returns the refreshed user. |
| EV-008 | be | `src/features/api/core/graphql/mutations/profile/claim-daily-quest-reward/claim-daily-quest-reward.resolver.ts:39` | api | The authenticated claimDailyQuestReward mutation delegates atomic completion, duplicate-claim and reward granting rules. |
| EV-009 | be | `src/features/api/core/graphql/queries/league/my-league/my-league.resolver.ts:55` | api | The authenticated myLeague query returns the viewer's weekly tier and ranked cohort. |
