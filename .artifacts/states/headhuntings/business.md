# Headhuntings — business map

Source read: `src/modules/bussiness/headhuntings/**`, `src/features/api/core/graphql/queries/headhuntings/**`,
`src/modules/databases/postgresql/primary/entities/{consultant,headhunting-company}*.entity.ts`.

## What this domain is

A read-only IT-recruitment marketplace: **headhunting companies** (recruiter agencies, e.g. Pegasi)
each employ a list of **consultants** (named recruiter profiles). Both are indexed into Elasticsearch
(per-locale index, one doc per row) and served through GraphQL queries only — there is **no mutation
surface** in this domain at all. Companies and consultants are populated out-of-band, by the seeders
under `src/modules/init/seeders/headhuntings/` and kept in sync into ES by
`src/modules/init/synchronizers/elasticsearch-synchronizer/builder/{consultant,headhunting-company}.service.ts`.
Nothing in the GraphQL schema lets a headhunter or an admin create/edit a company or a consultant —
that is entirely a content-ops (seed/CMS-adjacent) responsibility, not a runtime user action.

## Entities

- **`HeadhuntingCompanyEntity`** (`headhunting_companies`) — `title`, `displayId` (routing slug),
  `description`, `websiteUrl`, `logoUrl`, `address`, `phone`, `email`, `facebookUrl`, `linkedinUrl`,
  `orderIndex`/`sortIndex` (display ordering), `defaultLocale`, `translations` (localized copy),
  `consultants` (the employed roster).
- **`ConsultantEntity`** (`consultants`) — `fullName`, `displayId`, `jobTitle`, `description`,
  `linkedinUrl`, `email`, `phoneNumber`, `zaloNumber`, `avatarUrl`, `orderIndex`/`sortIndex`,
  `defaultLocale`, `company` (the employer, cascade-deleted with it), `translations`.
- Two **request-scoped, non-persisted fields** stamped onto every `ConsultantEntity` returned from a
  query, never stored in Postgres or ES: `contactUnlocked: boolean` and `cvScoreUnlockThreshold: number`.

## The one real state machine: the contact-reveal gate

This domain's only actual "state" is not on the entity — it is **per (viewer, consultant) request**,
computed fresh on every read:

1. **Viewer's CV trust score** (`CvVerificationService`) — classifies the viewer into one of three
   levels by two existence probes against Postgres (never counted, never AI-judged):
   - `SelfReported` — no graded StarCi work at all → **score 0**
   - `ActivityBacked` — has a graded challenge submission, no passed capstone → **score 0**
     (2026-07-05 decision: challenges are practice, they must not unlock a recruiter's contact info)
   - `CapstoneVerified` — has a passed milestone/capstone task → **score 100**
   - An anonymous viewer (`userId` absent) short-circuits to score `0` without touching the DB.
2. **The gate** (`ConsultantContactGateService.gateConsultant`) — compares that scalar score against
   `CV_SCORE_UNLOCK_THRESHOLD = 70` (a deliberately placeholder value, not yet calibrated):
   - **≥ 70 → unlocked**: `contactUnlocked = true`, `email`/`phoneNumber`/`zaloNumber`/`linkedinUrl`
     pass through untouched.
   - **< 70 → locked**: `contactUnlocked = false`, and all four contact fields are **nulled out
     server-side** (mutated in place before the response leaves the process) — never hidden
     client-side, never sent over the wire at all.
   - `cvScoreUnlockThreshold` is always echoed back (regardless of unlock state) so the FE can render
     "cần điểm CV ≥ X" without hardcoding the number.

**Invariant**: the reveal decision is a pure function of one scalar (`bestCvScore`), never of how many
CVs or courses produced it — a viewer with one high-scoring CV and a viewer with five CVs summing to
the same best score get an identical reveal. This is asserted directly in
`consultant-contact-gate.service.spec.ts`.

## Where the gate is applied

Every query that can surface a `ConsultantEntity` (or a company carrying nested consultants) applies
the gate before returning:

- `consultant(id | displayId)` → `ConsultantHandler` — single consultant, gated via `gateConsultant`.
- `consultants(companyId, filters)` → `ConsultantsHandler` — paged list, gated via `gateConsultants`
  (one shared score lookup for the whole page, not per-row).
- `headhuntingCompany(id | displayId)` → `HeadhuntingCompanyHandler` — gates any nested `consultants`
  the company document happens to carry (defense-in-depth: the current ES mapping does not embed
  them, but the code does not assume that stays true).
- `headhuntingCompanies()` → `HeadhuntingCompaniesHandler` — same defense-in-depth nested-gate.
- `consultantSuggestions` / `headhuntingCompanySuggestions` (typeahead) never touch the gate — they
  return only `{ id, label }` via the shared `AbstractSuggestionsHandler`, so there is no contact
  field to leak in the first place.

All four data-bearing queries use `KeycloakOptionalAuthGraphQLGuard`: an anonymous caller still gets a
full payload, just permanently locked (`contactUnlocked: false`). A logged-in caller's identity comes
only from the guard-populated `user`, never from a client-supplied id.

## Invariants a screen can rely on

- A `ConsultantEntity` never leaves the process with `contactUnlocked: false` **and** a populated
  contact field at the same time — the two are set atomically in `gateConsultant`.
- `cvScoreUnlockThreshold` is the same number (`70`) on every consultant in a given response; it is
  not per-consultant.
- Deleting a `HeadhuntingCompanyEntity` cascades to delete every `ConsultantEntity` under it
  (`onDelete: "CASCADE"` both directions) — a consultant never outlives its company.
- There is no path in this domain that mutates a company or a consultant at request time — the entity
  data itself only changes via a reseed + resync, never via a GraphQL mutation.
