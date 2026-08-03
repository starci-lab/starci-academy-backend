# es-sync — findings

Graded against `.claude/canon/be/enforce/authoring/testing.md` and read for defect independent of
canon (this domain has no GraphQL surface, so `authorization.md` does not apply — noted, not a gap).
Scope read: `src/modules/bussiness/es-sync/*` (service, CDC listener, types, module).

## 1. [edge-case] `reindexAll`'s prune-orphans step can delete a document created in the gap between its paginated snapshot and the prune call

- **Anchor**: `src/modules/bussiness/es-sync/es-sync-user.service.ts:142-190` (`reindexAll`) — `liveIds`
  is accumulated by paging through `isDeleted: false` users (`:150-160`), and the prune runs AFTER
  every page has been read (`:181-184`, `pruneOrphans({ ids: liveIds })`).
- **Judgment, not a canon breach** (no test-tier or authorization rule covers this shape directly, but
  it is a real correctness gap): `reindexAll` is documented as running "at seed/init," and
  `EsSyncUserListener` (the CDC path) ALSO starts consuming on `onModuleInit` (`es-sync-user.listener.ts:63`)
  — both can be live at the same boot. If a new user is created (and CDC-indexed via `reindexOne`) in
  the window between `reindexAll`'s LAST page fetch and its prune call, that user's id is not in the
  snapshot's `liveIds`, so `pruneOrphans` deletes the brand-new, genuinely live document the CDC
  listener just wrote. The failure self-heals on the user's NEXT row-change (another CDC event
  re-indexes them), but until then a real user is invisible to search with no error surfaced anywhere.
- **What breaks**: nothing loud — no exception, no log — a just-created user silently missing from
  search results for an indeterminate window after a backfill run. Worth a comment at minimum (this
  is a known, accepted race), or narrowing the window by pruning against a fresher live-id read taken
  right before the prune call rather than the one accumulated across the whole paginated pass.

## 2. [test-tier] Zero unit specs for the sync service and its CDC listener

- **Anchor**: `src/modules/bussiness/es-sync/` has no `*.spec.ts` file — `reindexOne`'s
  live-vs-soft-deleted branch (`es-sync-user.service.ts:108-133`), `reindexAll`'s pagination +
  prune (`:142-190`), and the listener's envelope-unwrap fallback (`es-sync-user.listener.ts:112-145`,
  "`payload` nested vs. top-level row") are all untested.
- **Rule broken**: `testing.md` §1 — a unit spec with the `EntityManager` and
  `ElasticsearchService` mocked (the same shape `user.service.spec.ts` already uses for
  `UserService`) would cost nothing and would have been the natural place to catch #1 above (assert
  that a user created after the snapshot but before the prune is not deleted) once it was written.
- **What breaks**: the soft-delete branch specifically — `reindexOne` deciding "delete from index" vs
  "index the row" hinges on one boolean (`user.isDeleted`) with no test proving a soft-deleted user's
  doc actually gets removed rather than re-indexed with stale data.

## 3. [edge-case, minor] Offset pagination in `reindexAll` can skip or double-visit a row under concurrent deletion during the backfill

- **Anchor**: `es-sync-user.service.ts:150-160` — pages are read via `skip`/`take` over
  `order: { id: "ASC" }`; if a user earlier in id-order is deleted WHILE the backfill is mid-run, every
  subsequent page's `skip` offset is now one row short of where it "should" be, and the row that would
  have been at the boundary is skipped for this pass.
- **Judgment, not a canon breach**: self-heals via the next CDC event for any row this affects, and a
  cursor-based (`WHERE id > lastSeenId`) page would remove the class of bug entirely — worth doing
  only if `reindexAll` starts running against a live, high-churn table rather than at boot when churn
  is low.
