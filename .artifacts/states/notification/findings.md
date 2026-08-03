# Notification -- findings

Graded against `.claude/canon/be/enforce/authoring/{authorization,testing,naming-and-structure,comments,validation}.md`.
The security shape of this domain is genuinely good -- ownership folded into every lookup, guards
present on every mutation and query, idempotent read-state mutation. The gap is almost entirely
test-tier. Ranked most severe first.

## 1. test-tier

1. **Zero `.spec.ts` files anywhere in this domain** -- confirmed by a recursive search of
   `src/modules/bussiness/notification/**` and every file under
   `src/features/api/core/graphql/{queries,mutations}/notifications/**`: no unit spec for
   `NotificationService` (five methods: `createNotification`, `listNotifications`, `countUnread`,
   `markAsRead`, `markAllAsRead`), none for `SocialDigestCronService`, and none for any of the four
   resolvers (`MyNotificationsResolver`, `MyUnreadNotificationCountResolver`,
   `MarkNotificationAsReadResolver`, `MarkAllNotificationsAsReadResolver`). Per [[testing]] SS1, this is
   exactly the shape that costs nothing to test (dependencies are the entity manager, the event
   emitter, the projection service -- all mockable) and is where a branch like "already read ->
   idempotent no-op" (`notification.service.ts:205-207`) or "anonymous/missing row -> not-found"
   belongs by default. Right now the only proof either branch works is reading the code.
2. **`SocialDigestCronService.sendDailyDigests` in particular has no coverage of its aggregation math**
   -- `src/modules/bussiness/notification/social-digest-cron.service.ts:71-148` hand-rolls a
   `(userId, type) -> count` fold (lines 96-113) and a follower/reply-count split (lines 118-121) with
   no test proving the grouping or the `NewFollower`/`CommentReply`+`CommunityReply` fold is correct --
   and because the whole method is wrapped in a swallow-and-log try/catch, a broken aggregation would
   fail silently in production (logged, not surfaced) with no test to have caught it first.

## 2. naming (cross-domain DRY, noted here as the domain of origin for one instance)

3. **`MAX_LIMIT = 100` + the `Math.min(Math.max(limit ?? 20, 1), MAX_LIMIT)` clamp is redefined locally**
   -- `src/features/api/core/graphql/queries/notifications/my-notifications/my-notifications.resolver.ts:38,107-109`.
   Identical constant and clamp shape also appears three times in the learner-cms domain (see that
   domain's findings.md, axis "naming") -- four call sites total for what [[naming-and-structure]] SS4
   would already call a promotion-eligible shared helper.

## 3. business-logic (judgement, not a canon breach)

4. **The digest cron's failure mode is invisible past the log line** --
   `social-digest-cron.service.ts:142-147` catches every error, logs message + stack, and returns.
   That is the documented, deliberate design ("a bad run can never crash the scheduler"), but it also
   means a persistently failing digest (e.g. a bad SQL after a schema change) produces no alert a human
   would see outside of log-scraping -- worth a metrics/alert hook if this email is considered
   business-critical, a decision for the teacher rather than a code fix.

## Not findings (verified, called out so a later pass does not re-flag them)

- `markAsRead`/`markAllAsRead`/`listNotifications`/`countUnread` all scope by `user.id` in the query
  itself, and an unowned notification id is indistinguishable from a missing one
  (`NotificationNotFoundException`) -- textbook match for [[authorization]] SS3.
- Every mutation and non-public query carries `KeycloakAuthGraphQLGuard` -- none of the four
  notification endpoints is optional-auth (correctly, since none of this data is ever public).
- `NotificationType`'s ten enum members each carry accurate, non-redundant JSDoc, matching
  [[comments]] SS3's "every enum member" requirement -- the best-documented enum seen across this
  bundle.
- `markedCount: result.affected ?? 0` correctly guards the documented "some drivers return undefined"
  case rather than letting `undefined` leak into the GraphQL `Int` field.
