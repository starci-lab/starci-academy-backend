# Community — findings

Ranked most severe first. Axes per `starci-be-deepscan-map`: naming, jsdoc,
business-logic, edge-case, security, gate-middleware, test-tier.

## 1. [test-tier] Zero unit-test coverage for the whole domain
No `*.spec.ts` exists anywhere under `src/modules/bussiness/community/` —
`community-post.service.ts`, `community-comment.service.ts`,
`community-reaction.service.ts`, `community-post-quota.service.ts` are all
untested. Contrast with the sibling `discussion` domain, which has
`comment.service.spec.ts` and `reaction.service.spec.ts` covering the
equivalent ownership/404/reaction branches. Per [[testing]] every domain
needs a unit spec for its branches; this one has none. What breaks: the
ownership guards (`CommunityPostForbiddenException`,
`CommunityPostCommentForbiddenException`), the founder-only pin gate, and the
non-member quota math are all unverified by any automated test — a refactor
could silently invert an `authorId !== user.id` check and nothing would fail
red.
- `src/modules/bussiness/community/community-post.service.ts` (whole file)
- `src/modules/bussiness/community/community-comment.service.ts` (whole file)
- `src/modules/bussiness/community/community-reaction.service.ts` (whole file)
- `src/modules/bussiness/community/community-post-quota.service.ts` (whole file)

## 2. [gate-middleware] Founder identity is a username string comparison, not a role/guard
`setPinned` gates on `user.username !== envConfig().community.founderUsername`
inline inside the service
(`src/modules/bussiness/community/community-post.service.ts:195-200`), and the
same pattern repeats in `discussion/comment.service.ts:339` and
`chat/chat.service.ts:244`. There is no `FounderGuard`/role check at the
resolver layer (`set-community-post-pinned.resolver.ts` only applies
`KeycloakAuthGraphQLGuard`) — the founder concept lives entirely as a
config-driven string equality check duplicated three times across three
domains. Per [[authorization]], a privileged action should be gated by a
reusable guard, not a duplicated inline string compare; a future refactor that
misspells or forgets the check on a fourth founder-only mutation has no
canon-level guard to catch it. What breaks: this is a design smell more than
an active hole today (the check itself is present and correct in every
current call site), but it is not enforceable by review at the guard layer —
a new founder-only mutation can ship with no gate and nothing will flag it.
- `src/modules/bussiness/community/community-post.service.ts:195`
- `src/modules/bussiness/discussion/comment.service.ts:339`
- `src/modules/bussiness/chat/chat.service.ts:244`

## 3. [edge-case] Comment listing does not exclude soft-deleted rows (post listing does)
`countReplies` and `countCommentsByPosts`
(`src/modules/bussiness/community/community-comment.service.ts:278-340`)
intentionally count soft-deleted rows ("Soft-deleted comments still count so
the feed's 'N comments' stays stable" — accurate per the JSDoc) — but
`listComments` (same file, lines 234-271) does **not** filter `isDeleted`
either, so a deleted comment is returned in the listing itself, not just
counted. This is asymmetric with `listFeed`
(`community-post.service.ts:241-243`), which explicitly filters `isDeleted:
false` for posts. A FE built against the post-listing behavior would
reasonably but wrongly assume comment-listing also hides deleted rows.
- `src/modules/bussiness/community/community-comment.service.ts:234-271` (no `isDeleted` filter)
- `src/modules/bussiness/community/community-post.service.ts:241-243` (contrast: filters `isDeleted`)

## 4. [jsdoc] Listing types do not document that soft-deleted rows are included
Minor — all interfaces in `src/modules/bussiness/community/types/index.ts`
carry field-level JSDoc, but neither `ListCommunityCommentsResult` nor
`ListCommunityCommentsParams` mentions that soft-deleted comments are
included in the result, which is the one behavior a consumer most needs to
know to render a placeholder correctly instead of a live body.
- `src/modules/bussiness/community/types/index.ts:107-125`
