# Notification — business map

Source read: `src/modules/bussiness/notification/**`,
`src/modules/databases/postgresql/primary/entities/notification.entity.ts`,
`src/features/api/core/graphql/{queries,mutations}/notifications/**`.

## What this domain is

Per-user, private, in-app notifications (the bell) plus a daily best-effort activity-digest email
cron. Distinct from the public `ActivityEntity` feed (append-only, everyone-visible) — a
`NotificationEntity` row is private to its one recipient and carries a genuine read/unread lifecycle.

## Entity and its one real state

`NotificationEntity` (`notifications`): `user` (recipient, `onDelete: CASCADE`), `type`
(`NotificationType` enum — 10 members, each with recruiter-facing JSDoc: `System`, `ChallengeGraded`,
`CodingGraded`, `MilestoneGraded`, `NewFollower`, `CommentReply`, `CommunityReply`,
`SubscriptionGranted`, `Announcement`, `StreakMilestone`), `payload` (jsonb `NotificationMetadata` —
i18n `title`/optional `body` as `{ key, params }` descriptors, never stored display text, plus an
optional `target` snapshot `{ entityName, id, label }` for a clickable row), and `readAt`.

**The only state transition in this domain**: `readAt: null` (unread) -> `readAt: <timestamp>` (read).
One-directional — nothing in the service or resolvers ever resets `readAt` back to `null`. Two ways to
make the transition:
- `markNotificationAsRead(notificationId)` — one row, idempotent (a second tap on an already-read row
  is a silent no-op, does not re-stamp or double-count).
- `markAllNotificationsAsRead()` — every currently-unread row for the caller, one bulk `UPDATE`,
  returns `markedCount` (rows actually flipped).

## Creation and fan-out

`NotificationService.createNotification` is the **only** write path into this table (confirmed: every
caller across `community`, `streak`, `follows`, the five payment-gateway webhook handlers, and three
AI grading pipelines goes through this one method — nothing constructs a `NotificationEntity` inline).
Each creation:
1. Persists the row (`readAt: null` — always starts unread), optionally inside a caller-supplied
   transaction so the notification commits atomically with whatever triggered it (e.g. inside the
   same transaction as a grading verdict).
2. Recomputes the recipient's unread-count projection (`UserStatsProjectionService`) in the same unit
   of work — the bell badge is a projection, not a live `COUNT`, lazily recomputed rather than queried
   fresh every poll.
3. Emits a local `NotificationCreated` event carrying a full render-ready snapshot, so the Socket.IO
   gateway can push it to the recipient's bell without a re-query.

## Reads

- `myNotifications(limit, offset, unreadOnly?, type?)` — the bell dropdown: a page of notifications
  plus the unread total in one round trip. `unreadOnly` and `type` are both optional narrowing filters
  (spread into the `WHERE` only when supplied, so the default listing stays unfiltered).
- `myUnreadNotificationCount()` — the badge alone, kept as a separate cheap query so the FE can poll
  just the number without pulling the full page.

## The daily digest — a separate, best-effort read of the same table

`SocialDigestCronService` runs once a day (08:00 Asia/Ho_Chi_Minh) and is **not part of the read/unread
lifecycle above** — it does not touch `readAt` at all. It aggregates the last 24h of notifications
per `(recipient, type)` for users with `emailDigestEnabled`, folds `NewFollower` + `CommentReply` +
`CommunityReply` counts into one summary line, and enqueues one digest email per user who had any
activity. Explicitly best-effort: the whole run is wrapped in one try/catch that logs and swallows any
failure — a broken run never crashes the scheduler and self-heals the next day; a bad email enqueue for
one user does not abort the sweep for the rest.

## Invariants a screen can rely on

- Ownership is folded into every lookup, not checked after the fact:
  `markAsRead`/`markAllAsRead`/`listNotifications`/`countUnread` all scope by `user.id` in the query
  itself. An id belonging to another user behaves exactly like a missing id
  (`NotificationNotFoundException`) — there is no separate "forbidden" response that would confirm the
  row exists.
- A notification is never re-opened: once `readAt` is stamped, no code path clears it.
- `markedCount` from `markAllAsRead` is the count of rows this call actually flipped, never a stale or
  cached number (`result.affected ?? 0`, coerced since some drivers return `undefined`).
- The digest cron reads notifications but never mutates them — running it twice in the same day is
  wasteful (duplicate emails) but not data-corrupting.
