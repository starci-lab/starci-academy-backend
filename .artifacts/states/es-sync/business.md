# es-sync — states, transitions, invariants

Source: `src/modules/bussiness/es-sync/` (`es-sync-user.service.ts`, `es-sync-user.listener.ts`,
`types/`). No GraphQL surface — this domain has no resolver and is invisible to any client; it exists
purely to keep the Elasticsearch `users` search index consistent with the `users` Postgres table for
whatever OTHER domain queries it (autocomplete, talent search, headhuntings). For a front-end reader:
this domain has no API of its own, but every user-search-shaped query elsewhere in the app depends on
it staying correct.

## The one thing being synchronized

One Elasticsearch document per live (non-soft-deleted) user, in the single non-localized `users`
index — id, username, displayName, bio, avatar, githubUsername, openToWork, and points
(`coinBalance`, usable as a popularity sort key). `buildDoc` is the SINGLE place this projection is
built; both sync paths below funnel through it, so the two paths can never disagree on shape.

## Two paths keep the index current — same target, different trigger

1. **Event-driven (steady state)** — `EsSyncUserListener` consumes Debezium's `users` CDC topic (every
   insert/update/delete on the Postgres table). Per message, it extracts only the row's `id` and asks
   `EsSyncUserService.reindexOne` to re-sync THAT user. The service always RE-READS the authoritative
   Postgres row rather than trusting the CDC payload's other fields — so a stale or partially-applied
   CDC message can never corrupt the index; at worst it triggers one extra re-read.
2. **Bulk backfill (cold start / recovery)** — `reindexAll`, called at seed/init, pages through every
   non-deleted user (500 at a time), bulk-indexes each page, then PRUNES any ES doc whose id wasn't in
   the just-indexed live set — so a user hard-deleted or already-soft-deleted before the backfill ran
   never lingers as an orphan search result.

## States per user (from the index's point of view)

- **Live** — indexed, searchable, reflects the current row.
- **Soft-deleted or gone** (`user.isDeleted` or `findOne` returns nothing) — `reindexOne` DELETES the
  ES doc rather than indexing a tombstone; a deleted user never appears in search results.
- **Never synced** (index missing the doc entirely) — self-heals on the next CDC event for that user,
  or the next full `reindexAll`.

## Invariants

- **Idempotent under at-least-once delivery.** Both `reindexOne` (id-keyed upsert or delete) and the
  bulk path are safe to re-run; a re-delivered or duplicate CDC message produces the same end state.
- **The index can never be more stale than "one boot" or "one CDC event" old** — `onModuleInit` ensures
  the index mapping exists (best-effort; ES being down at boot does not block app start), and a broker
  outage during listener startup is logged and swallowed rather than crashing the app — the sync
  simply pauses until the next successful boot or CDC redelivery.
- **This is deliberately NOT a CQRS projection** (own module note, `es-sync.module.ts:15-16`) — it
  writes to Elasticsearch, never to a Postgres read-model table, and owns its own Kafka wiring rather
  than sharing the CQRS projection base class.

## What a front-end reader can rely on

- A user who just changed their username/bio/avatar is searchable under the NEW value within one CDC
  round-trip, not instantly — there is no synchronous write-through.
- A soft-deleted or removed account never appears in search results, even momentarily, because delete
  always wins over any stale in-flight index write for that id.
