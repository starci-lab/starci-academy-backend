# Achievements — findings

Graded against .claude/canon/be/INDEX.md and its enforce/authoring/* shelves. Ranked most severe first.

## business-logic

1. src/modules/bussiness/achievements/badges/architect-rhino.badge.ts:20, fullstack-monkey.badge.ts:20, devops-wolf.badge.ts:20 -- three badges hard-code a course UUID literal directly in the SQL string, no named constant. On any environment reseeded with different course ids, the badge silently measures zero forever (no error). Judgement call, not a canon rule.
2. src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/* vs src/modules/bussiness/achievements/* -- two unrelated systems both use "achievement": the seeded-badge wall and the CV-builder's capstone-task picker. Naming collision risk for a FE/BE reader.

## jsdoc

3. src/features/api/core/graphql/queries/cv-submissions/my-pickable-cv-achievements/my-pickable-cv-achievements.service.ts:18-31 -- class + public execute method carry no JSDoc at all, unlike every other leaf service in this domain.

## edge-case

4. src/features/api/core/graphql/mutations/coding/submit-coding-solution/graphql-types/telemetry.input.ts:14-59 -- five optional numeric telemetry fields carry no @IsInt/@Min(0) validation, unlike the canon validation idiom.

## Not findings (checked, clean)

- Every achievements resolver carries the identity guard, and the by-id public read is additionally gated by GraphQLProfileVisibilityGuard (owner-or-unlocked, read from req.user) -- no IDOR found.
- AchievementsService + all 13 badges carry JSDoc; achievements.service.spec.ts covers single-tier/tiered award, idempotency, slug-mismatch skip.
- The CDC invalidation topic list covers every table the 13 badges actually read from.
