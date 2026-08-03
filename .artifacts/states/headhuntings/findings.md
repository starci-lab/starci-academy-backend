# Headhuntings — findings

Graded against `.claude/canon/be/enforce/authoring/{authorization,testing,naming-and-structure,comments,validation}.md`.
This domain is, overall, the cleanest of the three scanned in this bundle — heavy, accurate JSDoc,
solid unit coverage on the business services, guards present everywhere a guard belongs. Findings
below are the real gaps, ranked most severe first.

## 1. jsdoc

1. **`ConsultantNotFoundException` / `ConsultantNotFoundExceptionMetadata` carry zero JSDoc** —
   `src/modules/exceptions/errors/courses/consultant-not-found.ts:8` and `:13`. No class comment, no
   field comments, no explanation of when this fires (id lookup miss vs displayId lookup miss).
   Contrast with the sibling `NotificationNotFoundException`
   (`src/modules/exceptions/errors/notification/notification.ts:8-20`), which documents both the
   metadata fields and the ownership-doubles-as-forbidden nuance — proving this is a real gap in this
   file, not a repo-wide convention. Breaks [[comments]] §3 ("JSDoc required on every public class").
2. **`HeadhuntingCompanyNotFoundException` / `...Metadata` — same gap** —
   `src/modules/exceptions/errors/courses/headhunting-company-not-found.ts:8` and `:13`. Identical
   shape, identical omission.

## 2. test-tier

3. **No spec for the two autocomplete handlers** — `consultant-suggestions.handler.ts` and
   `headhunting-company-suggestions.handler.ts` have no `.spec.ts` beside them (only `consultant/`,
   `consultants/`, and `headhunting-company/` have handler specs; `headhunting-companies/` does too).
   Low severity: both are one-line subclasses of `AbstractSuggestionsHandler` declaring only
   `entityName`, so the risk surface is "did I spell the entity name right", not real logic — but per
   [[testing]] §1, a `.spec.ts` colocates with every unit by default, and there is none to prove even
   that.

## 3. business-logic (judgement, not a canon breach)

4. **`CV_SCORE_UNLOCK_THRESHOLD = 70` is explicitly a placeholder, not calibrated** —
   `src/modules/bussiness/headhuntings/constants/index.ts:8`, cross-referenced from
   `cv-verification.service.ts:129-133`. This is self-disclosed in the code's own comments (not a
   silent risk), but is worth surfacing here because it directly gates a monetizable feature (a
   recruiter's contact reveal) on a number the team has stated it has not yet tuned — a decision for
   the teacher, not a code fix.

## Not findings (verified, called out so a later pass does not re-flag them)

- `KeycloakOptionalAuthGraphQLGuard` on all four data-returning queries is a deliberate, commented
  design (anonymous viewers get a fully-locked payload) — matches the [[authorization]] §1 exception
  for "the public read that is deliberately open... has to say so."
- No GraphQL mutation exists anywhere in this domain — confirmed by grep across
  `src/features/api/core/graphql/mutations/**`; company/consultant data is seed-managed, not a gap.
- The nested-consultants gating in `HeadhuntingCompanyHandler`/`HeadhuntingCompaniesHandler` is
  defense-in-depth for an ES mapping shape that does not currently occur — intentional, documented.
