# Discussion — business state map

Source: `src/modules/bussiness/discussion/` (`comment.service.ts`,
`reaction.service.ts`) + entities `content-comment.entity.ts`,
`content-reaction.entity.ts`, `comment-reaction.entity.ts`,
`activity-reaction.entity.ts` under
`src/modules/databases/postgresql/primary/entities/`.

The lesson/course Q&A and engagement layer: threaded questions on a lesson or
on a whole course, Facebook-style reactions on lesson content, comments, and
feed activities, plus a founder "officially answered" signal.

## Entities

- **ContentCommentEntity** (`content_comments`) — `body`, `isDeleted`,
  `editedAt`, `contentId` (nullable), `courseId` (nullable), `userId`,
  `parentCommentId` (self-relation). Dual-purpose: a per-lesson question
  (`contentId` set) or a whole-course general question (`courseId` set,
  "hỏi chung khóa").
- **ContentReactionEntity** — one row per `(content, user)`, keyed going
  forward by `(enrollment, user)` during a migration (both columns set on
  write, per `reaction.service.ts:94-132`).
- **CommentReactionEntity** — one row per `(comment, user)`.
- **ActivityReactionEntity** — one row per `(activity, user)`; the one target
  with a self-reaction ban.

## States and transitions

### Comment / question
`draft` → **create**: exactly one of `contentId`/`courseId` must be set for a
top-level comment (never both, never neither — `CommentInvalidScopeException`
otherwise); a reply always inherits its parent's scope, ignoring whatever
scope fields the caller passed → `live` → (**edit** ⇄ `live`, stamps
`editedAt`) → **soft-delete** → `deleted` (row + replies survive, `[deleted]`
placeholder rendered).

- A per-lesson comment has a realtime room (Socket.IO push on
  create/update/delete); a course-general question has **no** room — the
  event is only emitted `if (resolvedContentId)`
  (`comment.service.ts:137-146, 176-185, 212-220`). A course-general
  question's page must re-fetch on its own; it will never receive a push.
- **Course Q&A roll-up** (`listCourseQuestions`) is a separate read model
  layered on top of the same table: a "question" = any top-level, non-deleted
  comment reachable from the course either via `content → module → course` or
  directly via `comment.course_id`. It supports three view states —
  `Unanswered` (FIFO oldest-first, "answering queue"), `Answered`, `Mine` —
  plus `All`, each computed via an `EXISTS`/`NOT EXISTS` subquery on
  non-deleted replies so pagination totals match the filter exactly.
  "Answered" here means **any** non-deleted reply exists, not specifically a
  founder reply.
- **Officially answered** is a distinct, narrower signal:
  `findFounderAnswered` flags a question only when at least one of its
  non-deleted replies was authored by the single configured founder username
  (`comment.service.ts:333-363`). A question can be `Answered` (has replies)
  but not "officially answered" (no founder reply among them) — these are two
  different badges the FE must not conflate.

### Reaction (content / comment / activity)
`none` ⇄ **react(type)** ⇄ `type=X`, same upsert/delete-on-null shape as
Community. Two behavioral differences from Community:
1. **Content reactions are not self-blocked** (a user may react to any
   content, since content has no personal "owner" in the social sense) but
   **activity reactions ARE self-blocked** — `reactToActivity` throws
   `ActivitySelfReactionException` if the activity's `user_id` equals the
   reactor (`reaction.service.ts:161-184`). A content reaction and an
   activity reaction on the same underlying event can therefore behave
   differently for the same user.
2. **Content reactions carry `viewCount`/`shareCount`** sourced from the
   content-engagement CQRS projection (`ContentEngagementProjectionService`),
   recomputed inline on every reaction change so the mutation's own response
   is fresh even though CDC also covers it asynchronously. Comment and
   activity reactions never carry view/share counts (always 0).

## Invariants

1. **Ownership**: only `comment.userId === user.id` may edit/delete a
   comment — identical shape to Community, enforced in-service.
2. **Exactly-one scope** on a top-level comment/listing:
   `Boolean(contentId) === Boolean(courseId)` is the literal guard
   (`comment.service.ts:105, 251`) — TypeORM silently drops `undefined`
   conditions, so an unguarded top-level listing would otherwise match every
   comment across every content/course; this is explicitly called out in the
   source as the reason the guard exists.
3. **A reply always inherits, never spoofs, its scope** — the caller's own
   `contentId`/`courseId` are discarded once a `parentCommentId` is given.
4. **At most one reaction row per `(target, user)`** across all three
   reaction targets, enforced by composite DB uniques, mirrored by
   find-or-create-or-update-or-delete logic in the service.
5. **A user can never react to their own feed activity** — the only
   self-reaction ban in either domain (Community explicitly allows it).
6. **`findFounderAnswered` excludes soft-deleted replies** — deleting a
   founder's answer un-flags the question as officially answered.

## Cross-domain notes

- `ReactionSummaryResult` (shared shape, `types/reaction.ts`) is reused by
  both Community and Discussion reaction services — a FE reading one
  contract can read both.
- Mutations fan out `EventName.Comment{Created,Updated,Deleted}`,
  `EventName.{Content,Comment}ReactionChanged` for the Socket.IO gateway
  (content-scoped only; course-general questions have no room, see above).
