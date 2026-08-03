# Discussion — findings

Ranked most severe first. Axes per `starci-be-deepscan-map`: naming, jsdoc,
business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [edge-case] `reactToContent` has no content-existence guard; every sibling reaction path does
`ReactionService.reactToContent` (`src/modules/bussiness/discussion/reaction.service.ts:67-151`)
never checks that `contentId` refers to an existing row before writing a
reaction. Compare:
- `reactToComment` (same file, lines 250-266) explicitly loads the comment
  and throws `CommentNotFoundException` if missing.
- `reactToActivity` (same file, lines 166-184) explicitly loads the activity
  owner and throws `ActivityNotFoundException` if missing.
- Community's `reactToPost` (`community-reaction.service.ts:64-74`) explicitly
  counts the post and throws `CommunityPostNotFoundException` if missing.

`reactToContent` instead goes straight to `findOne` on `ContentReactionEntity`
(which legitimately returns null for "no existing reaction," so a missing
content is indistinguishable from "not yet reacted"), then — on a first-time
reaction — does `findOne(ContentEntity, ...)` only to resolve `courseId` for
the enrollment write (line 97-108); if that resolves null, `courseId` is null,
`enrollment` is null, and it proceeds anyway to `save` a
`ContentReactionEntity` with `content: { id: contentId }` for a content id
that was never verified to exist. The resolver-level `GraphQLEnrollmentGuard`
(`src/modules/bussiness/guards/graphql-enrollment.guard.ts`) does not help
either — it resolves enrollment from the `x-course-id` header, not from
`contentId`, and is "permissive by design" (its own JSDoc), a no-op when the
header is absent. What breaks: reacting to a garbage/typo'd or already-purged
`contentId` either silently inserts an orphaned reaction row (if there is no
FK constraint) or surfaces a raw Postgres foreign-key-violation 500 to the
client (if there is one) instead of the clean, typed
`ContentNotFoundException`-style error every other reaction path returns.
- `src/modules/bussiness/discussion/reaction.service.ts:67-151` (missing guard)
- `src/modules/bussiness/discussion/reaction.service.ts:255-266` (contrast: comment does guard)
- `src/modules/bussiness/discussion/reaction.service.ts:166-184` (contrast: activity does guard)

## 2. [gate-middleware] Founder identity is a username string comparison, not a role/guard
Same class of finding as Community #2 — `findFounderAnswered`
(`src/modules/bussiness/discussion/comment.service.ts:339`) reads
`envConfig().community.founderUsername` and joins on `author.username =
:founderUsername` directly in a query builder, with no reusable
role/guard abstraction. Here it is read-only (labeling, not gating a
mutation) so the blast radius is smaller than the Community pin case, but it
is the same duplicated pattern (three domains, one string compare each) with
no single source of truth a reviewer can point at.
- `src/modules/bussiness/discussion/comment.service.ts:339`

## 3. [business-logic] "Answered" (has any reply) and "officially answered" (has a founder reply) are easy to conflate
`CourseQuestionFilter.Answered` (`types/comment.ts:99`) filters on "at least
one non-deleted reply exists" via a raw `EXISTS` subquery
(`comment.service.ts:436-440`), while `answeredByFounder`
(`findFounderAnswered`, lines 333-363) is a narrower, separately-computed
flag. Both are surfaced per-question in the same `CourseQuestionRow` shape
(`types/comment.ts:129-136`) with adjacent but differently-scoped semantics,
and nothing in the type-level JSDoc calls out that a question can be
`Answered = true` (filter) yet `answeredByFounder = false` (flag) at the same
time. This is a real distinction the FE needs to get right for the "Đã trả
lời" vs "Founder đã trả lời" badges, and the two are one word apart in the
schema.
- `src/modules/bussiness/discussion/comment.service.ts:333-363` (founder flag)
- `src/modules/bussiness/discussion/comment.service.ts:430-441` (answered filter)
- `src/modules/bussiness/discussion/types/comment.ts:90-136` (both surfaced with no cross-reference)

## 4. [test-tier] Reaction/comment specs exist but do not cover the missing-content-existence path (see #1), the course-Q&A roll-up, or the founder-answered flag
`comment.service.spec.ts` and `reaction.service.spec.ts` cover
create/update/delete ownership branches, `countReplies`, and
`reactToContent`/`reactToComment` happy paths, but neither spec exercises
`listCourseQuestions`, `findFounderAnswered`, or a `reactToContent` call with
a non-existent `contentId` (there is no such test because there is no such
guard to test — see finding #1). This leaves the roll-up's three
`EXISTS`/`NOT EXISTS` branches and the founder-answered join entirely
untested.
- `src/modules/bussiness/discussion/comment.service.spec.ts` (no `listCourseQuestions`/`findFounderAnswered` tests)
- `src/modules/bussiness/discussion/comment.service.ts:333-469` (untested methods)
