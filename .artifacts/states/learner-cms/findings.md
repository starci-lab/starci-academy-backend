# Learner-CMS -- findings

Graded against `.claude/canon/be/enforce/authoring/{authorization,testing,naming-and-structure,comments,validation}.md`.
This domain is the weakest of the three in this bundle: the read logic itself is careful (parameterised
SQL, owner-scoped, clamped pagination), but it has zero test coverage and one stale piece of
documentation that actively misleads a reader about what data ships. Ranked most severe first.

## 1. test-tier

1. **Zero `.spec.ts` files anywhere in this domain** -- confirmed by a recursive search of
   `src/modules/bussiness/learner-cms/**` and the three query folders under
   `src/features/api/core/graphql/queries/learner-cms/**`: no unit spec for
   `ChallengeSubmissionsCmsService`, `MilestoneTaskAttemptsCmsService`, `LearningFeedbacksCmsService`,
   or any of the three resolvers (`MyChallengeSubmissionsResolver`, `MyLearningFeedbacksResolver`,
   `MyMilestoneTaskAttemptsResolver`). Every one of these hand-writes raw parameterised SQL with a
   nontrivial join chain (up to 6 tables) and a status-derivation branch
   (`ChallengeSubmissionsCmsService.deriveStatus`) -- exactly the branch/edge-case logic [[testing]] SS1
   says belongs in a unit spec by default, and there is not one to catch a join typo, an off-by-one in
   the `LIMIT $2 OFFSET $3` binding order, or a regression in `deriveStatus`'s three-way bucket.
   Highest-severity finding in this bundle: three learner-facing endpoints, no tests at all.

## 2. comments (stale JSDoc -- also a business-logic-adjacent risk)

2. **`MyLearningFeedbacksResolver`'s JSDoc still advertises a dropped data source** --
   `src/features/api/core/graphql/queries/learner-cms/my-learning-feedbacks/my-learning-feedbacks.resolver.ts:39-45`
   reads "merged across the three sources (challenge submission feedback, milestone-task feedback, CV
   review)" -- but `LearningFeedbacksCmsService.buildUnionSql`
   (`src/modules/bussiness/learner-cms/learning-feedbacks-cms.service.ts:103-139`) unions only TWO
   sources; its own JSDoc (`learning-feedbacks-cms.service.ts:27-31`) explicitly documents that the CV
   branch was dropped when the legacy `cv_submissions`/`cv_submission_attempts` tables were retired.
   The resolver's doc was never updated to match. Breaks [[comments]] SS5 ("a comment LIVES with its
   code -- change the code, change the comment"): a FE developer reading only the resolver (the file
   closest to the GraphQL schema) will believe CV review feedback is in this feed when it never
   ships. Trivial fix, real reader impact until it lands.

## 3. naming (DRY -- promotion trigger already crossed)

3. **`MAX_LIMIT = 100` and its clamp `Math.min(Math.max(limit ?? 20, 1), MAX_LIMIT)` are
   copy-pasted identically three times** -- once per resolver
   (`my-challenge-submissions.resolver.ts:40,91-93`, `my-milestone-task-attempts.resolver.ts:40,90-92`,
   and inlined as `safeLimit`/`safeOffset` in `my-learning-feedbacks.resolver.ts:36,85-89`). Per
   [[naming-and-structure]] SS4, promotion to a shared constant/helper is triggered by the SECOND
   consumer, not predicted in advance -- this is already the THIRD. (The same constant and clamp shape
   also appears a fourth time in the notification domain's `my-notifications.resolver.ts:38,107-109`,
   confirming the pattern is cross-domain, not local to learner-cms.) A future change to the ceiling or
   the clamp formula has four call sites to find and update in lockstep.

## 4. edge-case (judgement, not a canon breach)

4. **`status` on `ChallengeSubmissionItem` is a bare `string`, not an enum** --
   `src/features/api/core/graphql/queries/learner-cms/my-challenge-submissions/graphql-types/response.ts:53-59`
   and the derivation in `ChallengeSubmissionsCmsService.deriveStatus`
   (`challenge-submissions-cms.service.ts:109-123`) both return/accept a free string. The three literal
   values (`"pending"|"passed"|"failed"`) are enforced by exactly one method's `if` chain; nothing in
   the type system stops a future edit from returning a fourth string, or a typo'd casing, and the
   GraphQL schema exposes it to clients as an unconstrained `String`, not a schema enum a client can
   exhaustively switch over. Not a canon-named rule violation (validation.md SS4 covers enum *input*,
   not output shape) -- filed as a judgement call.

## Not findings (verified, called out so a later pass does not re-flag them)

- All three resolvers use `KeycloakAuthGraphQLGuard` (mandatory, not optional) and every SQL query
  scopes by the JWT's `user.id` -- no IDOR path, matches [[authorization]] SS1/SS3 exactly.
- Every list clamps `limit`/`offset` before the SQL runs -- no unbounded-scan edge case.
- The `LEFT JOIN challenges` in `ChallengeSubmissionsCmsService` for "V1 rows [that] may lack it" is a
  documented, deliberate migration-era accommodation, not an unexplained nullable join.
