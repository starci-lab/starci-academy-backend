# guards — findings

Graded against `.claude/canon/be/enforce/authoring/{authorization,testing}.md`. Scope read: the five
guard files in `src/modules/bussiness/guards/`, their one spec file, and every resolver in
`src/features/api/core/graphql/{mutations,queries}/**` that references any of them (`GraphQLEnrollmentGuard`
× 25, `GraphQLMustEnrolledGuard` × 16, `GraphQLProfileVisibilityGuard` × 21, `GraphQLAdminAccessGuard` × 1,
`AdminAccessGuard` × 1).

## 1. [test-tier] Three of the five guards — including the two that make an authorization DECISION — have zero unit tests

- **Anchor**: `src/modules/bussiness/guards/bussiness.guards.spec.ts` covers exactly two guards:
  `AdminAccessGuard` (lines 64-150) and `GraphQLMustEnrolledGuard` (lines 152-262). `GraphQLEnrollmentGuard`,
  `GraphQLProfileVisibilityGuard`, and `GraphQLAdminAccessGuard` (the GraphQL twin of the one REST guard
  that IS tested) have no spec anywhere in the tree.
- **Rule broken**: `testing.md` §1 — branchy logic belongs in a unit spec by default, and this is the
  one place in the codebase where "branchy logic" IS the authorization decision itself.
- **What breaks**: `GraphQLProfileVisibilityGuard` is the one guard with real conditional logic worth
  regression-testing (owner-bypass vs. locked-vs-unlocked vs. missing-id no-op,
  `graphql-profile-visibility.guard.ts:51-75`) and it has no test proving the owner-bypass branch
  (`viewer?.id === userId`) can't regress into "always allow" or "always deny" on a refactor.
  `GraphQLAdminAccessGuard` duplicates `AdminAccessGuard`'s exact logic for the GraphQL context
  extraction path (`gqlContext.req?.headers`) — the REST twin is tested, the GraphQL one (the one
  actually gating `ai-balancer-health`, live infra/key state) is not, so a context-extraction
  regression in the GraphQL variant specifically would ship untested.

## 2. [naming] `bussiness.guards.spec.ts` names itself as THE guards suite while covering 2 of 5

- **Anchor**: `src/modules/bussiness/guards/bussiness.guards.spec.ts:1` (file name) vs. its actual
  contents (only `AdminAccessGuard` + `GraphQLMustEnrolledGuard` `describe` blocks).
- **Rule broken**: `naming-and-structure.md` §6 — a file's name should say what it is; a lone spec
  file named after the whole folder, in a folder with 5 guards, reads as "the guards are tested" to
  anyone who doesn't open it and count `describe` blocks. `comments.md` doesn't require a manifest
  comment, but nothing else in the file signals the gap either.
- **What breaks**: nothing at runtime — this is a discoverability trap. A reviewer checking "is the
  authz layer tested" sees a `.spec.ts` file exists for `guards/` and reasonably assumes coverage; the
  finding above (#1) is exactly the kind of gap this naming hides.

## 3. [gate-middleware, judgment] Nothing mechanically distinguishes the "trial is enough" guard from the "must be paid" guard — the difference is which of two similarly-named classes a resolver author remembered to import

- **Anchor**: `graphql-enrollment.guard.ts:16-28` (`GraphQLEnrollmentGuard`, permissive — "does NOT
  enforce paid membership", always returns `true`) vs. `graphql-must-enrolled.guard.ts:20-21`
  (`GraphQLMustEnrolledGuard`, "checks `is_enrolled = true`"). Both classes are exported from the same
  `guards/index.ts` (`:1-5`), same naming pattern (`GraphQL*Guard`), one differing word
  (`Enrollment` vs. `MustEnrolled`).
- **Judgment, not a canon breach**: `authorization.md` §2 is satisfied — both ARE named guards, not an
  inline `if`. But nothing in the tree (lint rule, doc comment enforcement, test) ties a resolver's
  guard choice to whether its underlying feature is meant to be trial-accessible or paid-only; that
  mapping lives only in each resolver author's head and the JSDoc on the two guard classes. Today's
  usage IS consistent (flashcard/challenge-submission/content mutations use the permissive one;
  interview/personal-project/milestone/task mutations use the strict one) — but a new paid-tier
  feature built by copy-pasting a flashcard resolver inherits the permissive guard silently, with no
  test or lint catching that the copy needed to be upgraded to `GraphQLMustEnrolledGuard`.
