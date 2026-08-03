# Chat — findings

Ranked most severe first. Axes per `starci-be-deepscan-map`: naming, jsdoc,
business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [test-tier] Zero unit-test coverage for the whole domain
No `*.spec.ts` exists under `src/modules/bussiness/chat/` — `chat.service.ts`
is entirely untested. This is the same gap as Community (see
`.artifacts/states/community/findings.md` #1), but arguably higher-severity
here because `chat.service.ts` carries the *only* privacy boundary in the
domain: `assertCanAccess`'s member-gate and founder-DM-ownership check
(`chat.service.ts:230-252`) are the sole guard between "any active member"
and "read someone else's private founder DM." An accidental inversion of
`conversation.memberId !== user.id` (e.g. dropping the `!`) would let every
member read every other member's founder DM, and no test would catch it.
- `src/modules/bussiness/chat/chat.service.ts:230-253` (untested access-control method)
- `src/modules/bussiness/chat/chat.service.ts` (whole file, no spec)

## 2. [naming] `ChatMessageEntity.isDeleted` is documented and typed as a real capability that no code path can ever trigger
The entity JSDoc reads "Deletion is soft (`isDeleted`) so the thread shape
survives" and the field's own GraphQL description reads "Whether the message
was soft-deleted by its author"
(`src/modules/databases/postgresql/primary/entities/chat-message.entity.ts:24-27,55-69`).
`ChatService` has no method that ever sets this column to `true` — there is
no `deleteMessage`/`softDeleteMessage`, and no GraphQL mutation exists beyond
`sendChatMessage`
(`src/features/api/core/graphql/mutations/chat/send-chat-message/`). The
field, its column, and its GraphQL exposure describe a capability
(author-side delete) that is fully absent from the domain. This is either: a
dropped feature the entity/docs were never cleaned up after, or an
in-progress feature whose service method was never written. Either way, a FE
reading the GraphQL schema (which is where a FE reader actually looks, not
this file) will reasonably plan for a delete affordance that cannot exist.
What breaks: wasted FE work planning around a field that always reads
`false`, and a misleading `business.md`-style contract for anyone auditing
the schema without also reading the service.
- `src/modules/databases/postgresql/primary/entities/chat-message.entity.ts:24-27` (entity-level claim)
- `src/modules/databases/postgresql/primary/entities/chat-message.entity.ts:55-69` (field-level claim)
- `src/modules/bussiness/chat/chat.service.ts` (no delete method anywhere)

## 3. [gate-middleware] Founder identity is (again) a username string comparison, not a role/guard
`assertCanAccess` gates the founder-DM bypass on `user.username ===
envConfig().community.founderUsername` inline
(`src/modules/bussiness/chat/chat.service.ts:244`) — the third domain (after
Community's pin-gate and Discussion's founder-answered flag) to hand-roll the
same identity check with no shared guard/decorator. Here the stakes are
highest of the three instances: this is the actual authorization boundary
for reading a private DM, not a cosmetic pin or a read-only label. A typo in
the env var name, or a future rename of `founderUsername` that only updates
two of the three call sites, silently breaks (or over-grants) DM access with
no compile-time or review-time signal tying the three sites together.
- `src/modules/bussiness/chat/chat.service.ts:244`
- (same class as) `src/modules/bussiness/community/community-post.service.ts:195`
- (same class as) `src/modules/bussiness/discussion/comment.service.ts:339`

## 4. [edge-case] No handling for the concurrent-first-open race on the unique `(type, member)` constraint
`getOrCreateCommunityConversation` and `getOrCreateFounderDm`
(`chat.service.ts:56-104`) are plain find-then-create with no transaction or
`ON CONFLICT` handling. Two concurrent first-ever requests for the same
member's founder DM (e.g. two browser tabs opening the DM at once) will both
see `existing = null` and both attempt an insert; the DB unique constraint
(`UQ_chat_conversations_type_member`) will reject the second insert with a
raw Postgres unique-violation, which is not caught or translated into a retry
or a clean "conversation already exists, refetch" response anywhere in this
method. This is a narrow window (first-open only) but the failure mode is an
unhandled DB exception rather than the graceful degradation the rest of the
domain shows elsewhere (e.g. the empty-array short-circuits in Discussion's
batch methods).
- `src/modules/bussiness/chat/chat.service.ts:56-104`
