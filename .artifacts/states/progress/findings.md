# Progress — findings

Ranked most severe first. Axes: naming, jsdoc, business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [validation] `courseId` carries no `@IsUUID`/format validator on either progress query
`ChallengeSubmissionProgressRequest.courseId` and `MilestoneTaskProgressRequest.courseId` are `@Field(() => ID)` with NO class-validator decorator. Both flow into a TypeORM `where: { course: { id: courseId } }` lookup with no format check → a malformed courseId fails as a raw Postgres cast error, not the uniform 400.
- src/features/api/core/graphql/queries/challenges/challenge-submission-progress/graphql-types/request.ts:10-18
- src/features/api/core/graphql/queries/personal-project/milestone-task-progress/graphql-types/request.ts:10-18

## 2. [business-logic] Milestone-task progress recomputes with one DB round trip PER task, never batched (N+1)
`PersonalProjectProgressService.computeProgress` loops per task with sequential findOne+find (2 round trips/task); sibling `ChallengeProgressService.computeProgress` does the same shape in 2 queries total then joins in memory. 20 tasks → up to 40 sequential DB calls.
- src/modules/bussiness/progress/personal-project.service.ts:98-204
- contrast: src/modules/bussiness/progress/challenge.service.ts:150-296

## 3. [business-logic] Two divergent caching architectures for the same read model, one acknowledged superseded
Challenge side = CQRS projection table with isStale/TTL self-heal ("This replaces the old Redis cache — the projection table IS the cache now"). Milestone-task side still on plain Redis cache with no freshness check — a never-invalidated row has no time-based self-heal.
- src/modules/bussiness/progress/challenge.service.ts:31-41,88-116
- src/modules/bussiness/progress/personal-project.service.ts:46-79

## 4. [test-tier] No e2e coverage for either progress read path
Both handler specs mock EntityManager + service; no e2e exercises the real join (challenge→submission→user→attempt) against a containerized DB.
- src/features/api/core/graphql/queries/challenges/challenge-submission-progress/challenge-submission-progress.handler.spec.ts
- src/features/api/core/graphql/queries/personal-project/milestone-task-progress/milestone-task-progress.handler.spec.ts
