# Community — business state map

Source: `src/modules/bussiness/community/` (`community-post.service.ts`,
`community-comment.service.ts`, `community-reaction.service.ts`,
`community-post-quota.service.ts`) + entities under
`src/modules/databases/postgresql/primary/entities/community-post*.ts`.

A Facebook/Twitter-style member feed: posts, threaded comments, Facebook-style
reactions, one founder, per-channel scoping.

## Entities

- **CommunityPostEntity** (`community_posts`) — `body`, `channel` (enum,
  default `General`), `isPinned`, `isDeleted`, `editedAt`, `authorId`.
- **CommunityPostCommentEntity** (`community_post_comments`) — `body`,
  `isDeleted`, `editedAt`, `postId`, `userId`, `parentCommentId` (self-relation,
  null = top-level).
- **CommunityPostReactionEntity** / **CommunityPostCommentReactionEntity** —
  one row per `(target, user)`, `type` = emotion enum.

## States and transitions

### Post
`draft (in-memory)` → **create** → `live` → (**edit** ⇄ `live`, stamps
`editedAt`) → **soft-delete** → `deleted` (terminal from the API's point of
view; the row and its comment tree are kept, never surfaced in the feed again).

- Pin is an orthogonal flag, not a lifecycle state: `live` posts can be
  `pinned`/`unpinned` any number of times by the founder only
  (`community-post.service.ts:189-214`). A `deleted` post can still carry
  `isPinned = true` in the row — the pin is never cleared on delete, it is just
  never visible because the feed excludes `isDeleted` rows first.
- A non-member's **create** is gated by a rolling-window quota
  (`community-post-quota.service.ts`); an active member's is not. The quota
  counts posts created inside the window **including soft-deleted ones** — a
  non-member cannot free up quota by deleting a post they just made.

### Comment (thread)
`draft` → **create** (top-level, needs a `postId`; or reply, needs a
`parentCommentId` whose row must exist) → `live` → (**edit** ⇄ `live`) →
**soft-delete** → `deleted` (row + its own replies survive; a `[deleted]`
placeholder is what the client renders).

- A reply's parent must exist at creation time (404 if not) — a comment tree
  can never point at a phantom parent. There is no re-parenting; a comment's
  `parentCommentId` is fixed for its lifetime.
- Deleting a post does **not** cascade to `isDeleted` on its comments at the
  application layer — comments simply become unreachable once the post itself
  is excluded from the feed. The DB foreign key is `onDelete: CASCADE`, but the
  post is soft-deleted, never hard-deleted, so this FK path never fires in
  practice.

### Reaction (per user, per post/comment)
`none` ⇄ **react(type)** ⇄ `type=X` — at most one row per `(post|comment,
user)` (composite unique). Passing `type: null` removes the row; passing a new
type in place of an old one updates the same row (never a second row).
Community reactions **allow self-reaction** — the FE may let a user like their
own post/comment (`community-reaction.service.ts:39-43`), unlike feed
activities elsewhere in the backend.

## Invariants

1. **Ownership**: only `post.authorId === user.id` may edit/delete a post;
   only `comment.userId === user.id` may edit/delete a comment. Never
   bypassable — enforced in the domain service itself, so even a forged
   resolver call fails.
2. **Pin is founder-only**: gated by `user.username ===
   envConfig().community.founderUsername`, a single hardcoded identity, not a
   role table. Every other mutation is author-or-nobody.
3. **Soft-delete never removes the row**: `isDeleted` is the only delete
   signal on posts and comments; a client must always filter/style on this
   flag rather than assuming absence means deleted.
4. **A top-level comment always carries `postId`**; a reply always carries
   both `postId` (inherited) and a non-null `parentCommentId`.
5. **Feed listing always excludes `isDeleted` posts** — a deleted post can
   never resurface via `listFeed`, even pinned.
6. **Comment counts include soft-deleted comments** (`countCommentsByPosts`)
   so a post's "N comments" badge does not shrink when someone deletes their
   comment — but reply counts and comment listings do NOT filter `isDeleted`
   either, so a FE rendering a list must handle `isDeleted` rows explicitly
   rather than expect them pre-filtered.
7. **A user reacting to a comment that was created on a post that no longer
   exists** cannot happen — comment creation requires the post to exist, and
   posts are only soft- not hard-deleted, so a comment's post reference is
   always resolvable.

## Cross-domain notes

- Every mutation fans out an `EventEmitterService` event
  (`CommunityPost{Created,Updated,Deleted}`,
  `CommunityComment{Created,Updated,Deleted}`,
  `Community{Post,Comment}ReactionChanged`) that the Socket.IO gateway turns
  into a room push — the FE should treat GraphQL responses as
  optimistic-confirm and the socket event as the source of truth for other
  viewers.
- Creating a comment notifies the post author and (on a reply) the parent
  comment's author via `NotificationService`, never the actor themselves, and
  never the same recipient twice even if they are both targets.
